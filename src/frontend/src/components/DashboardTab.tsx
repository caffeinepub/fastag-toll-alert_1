import React, { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { MapPin, Navigation, AlertTriangle, BellOff, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Speedometer } from "./Speedometer";
import { useGeolocation } from "../hooks/useGeolocation";
import { useBeep } from "../hooks/useBeep";
import {
  useBalance,
  useVehicleType,
  useSetVehicleType,
  useDeductToll,
  useTollPlazas,
  useAddTollPlaza,
} from "../hooks/useQueries";
import { haversine } from "../utils/haversine";
import { TOLL_PLAZAS_DATA, VEHICLE_TYPES, getTollRate, toBackendTollPlaza } from "../utils/tollData";

// Recently deducted tolls: id → timestamp (ms)
const recentlyDeducted = new Map<string, number>();
const DEDUCT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const AUTO_DEDUCT_RADIUS_KM = 0.2; // 200 meters
const ALERT_RADIUS_KM = 5.0;
const SEEDS_KEY = "tolls_seeded_v7_gps_fixed";

function sendNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: "fastag-toll",
    });
  }
}

export function DashboardTab() {
  const geo = useGeolocation();
  const { isBeeping, muted, startBeeping, stopBeeping, silenceBeep } = useBeep();
  const { data: balance = 0, refetch: refetchBalance } = useBalance();
  const { data: vehicleType = "Car/Jeep/Van" } = useVehicleType();
  const setVehicleTypeMut = useSetVehicleType();
  const deductTollMut = useDeductToll();
  const { data: tollPlazas = [], isLoading: plazasLoading } = useTollPlazas();
  const addTollPlazaMut = useAddTollPlaza();

  // Interpolated distance — smoothly counts down using speed between GPS fixes
  const [interpolatedDistance, setInterpolatedDistance] = useState<number | null>(null);
  const interpRef = useRef<{
    baseDistKm: number;
    speedKmh: number;
    startTime: number;
    intervalId: ReturnType<typeof setInterval> | null;
  } | null>(null);

  const seedingRef = useRef(false);

  const mutateAsync = addTollPlazaMut.mutateAsync;

  // Seed (or re-seed) toll plazas — runs whenever SEEDS_KEY changes (GPS fix)
  useEffect(() => {
    if (seedingRef.current) return;
    if (localStorage.getItem(SEEDS_KEY)) return;
    if (!mutateAsync) return;

    seedingRef.current = true;

    async function seedAll() {
      try {
        // addTollPlaza upserts by ID — this overwrites any old wrong coordinates
        await Promise.all(
          TOLL_PLAZAS_DATA.map((p) => mutateAsync(toBackendTollPlaza(p)))
        );
        localStorage.setItem(SEEDS_KEY, "1");
      } catch (e) {
        console.warn("Toll seeding failed", e);
      } finally {
        seedingRef.current = false;
      }
    }
    seedAll();
  }, [mutateAsync]);

  // Notification permission is handled by the App banner (user-gesture driven)

  // Always use the local GPS-corrected toll data for distance calculations.
  // The backend copy may have stale coordinates from before a GPS fix update.
  const activePlazas = TOLL_PLAZAS_DATA;

  // Find nearest toll plaza (raw GPS distance)
  const nearestTollGps = React.useMemo(() => {
    if (geo.latitude === null || geo.longitude === null) return null;

    let nearest: { plaza: (typeof activePlazas)[number]; distanceKm: number } | null = null;

    for (const plaza of activePlazas) {
      const dist = haversine(geo.latitude, geo.longitude, plaza.latitude, plaza.longitude);
      if (!nearest || dist < nearest.distanceKm) {
        nearest = { plaza, distanceKm: dist };
      }
    }
    return nearest;
  }, [geo.latitude, geo.longitude]);

  // Keep a ref of current speed so the interval can read it without re-subscribing
  const speedRef = useRef(geo.speed);
  useEffect(() => { speedRef.current = geo.speed; }, [geo.speed]);

  // Track previous GPS distance to compute per-fix speed when device speed = 0
  const prevGpsDistRef = useRef<{ distKm: number; time: number } | null>(null);
  // Track the current interpolated distance as a ref
  const currentInterpDistRef = useRef<number | null>(null);

  // On every GPS fix: reset interpolation anchor using the new distance + effective speed
  useEffect(() => {
    if (!nearestTollGps) {
      setInterpolatedDistance(null);
      prevGpsDistRef.current = null;
      currentInterpDistRef.current = null;
      if (interpRef.current?.intervalId) {
        clearInterval(interpRef.current.intervalId);
        interpRef.current = null;
      }
      return;
    }

    const newGpsDist = nearestTollGps.distanceKm;
    const now = Date.now();

    // Compute effective speed: prefer GPS-reported speed; fall back to distance-delta speed
    let effectiveSpeed = speedRef.current; // km/h from GPS
    if (effectiveSpeed <= 0 && prevGpsDistRef.current) {
      const prev = prevGpsDistRef.current;
      const deltaDistKm = prev.distKm - newGpsDist; // positive if approaching
      const deltaTimeHr = (now - prev.time) / 3_600_000;
      if (deltaTimeHr > 0 && deltaDistKm > 0) {
        effectiveSpeed = deltaDistKm / deltaTimeHr;
      }
    }
    // Clamp to realistic range (0 – 200 km/h)
    effectiveSpeed = Math.max(0, Math.min(200, effectiveSpeed));

    prevGpsDistRef.current = { distKm: newGpsDist, time: now };

    // Stop any running interval
    if (interpRef.current?.intervalId) {
      clearInterval(interpRef.current.intervalId);
    }

    // Set new anchor at the GPS-reported distance
    interpRef.current = {
      baseDistKm: newGpsDist,
      speedKmh: effectiveSpeed,
      startTime: now,
      intervalId: null,
    };
    setInterpolatedDistance(newGpsDist);
    currentInterpDistRef.current = newGpsDist;

    // Smooth countdown: subtract distance traveled since this anchor every 500ms
    const id = setInterval(() => {
      if (!interpRef.current) return;
      // Always read the latest speed (updates as GPS reports new speed)
      const spd = interpRef.current.speedKmh > 0
        ? interpRef.current.speedKmh
        : speedRef.current;
      const elapsedHr = (Date.now() - interpRef.current.startTime) / 3_600_000;
      const traveled = spd * elapsedHr;
      const remaining = Math.max(0, interpRef.current.baseDistKm - traveled);
      currentInterpDistRef.current = remaining;
      setInterpolatedDistance(remaining);
    }, 500);

    interpRef.current.intervalId = id;

    return () => clearInterval(id);
  }, [nearestTollGps]);

  // Merge: use interpolated distance if available, otherwise GPS distance
  const nearestToll = nearestTollGps
    ? {
        ...nearestTollGps,
        distanceKm: interpolatedDistance !== null ? interpolatedDistance : nearestTollGps.distanceKm,
      }
    : null;

  const tollAmount = nearestToll
    ? getTollRate(nearestToll.plaza, vehicleType)
    : 0;

  const isApproaching =
    nearestToll !== null && nearestToll.distanceKm <= ALERT_RADIUS_KM;

  const isLowBalance =
    isApproaching && balance < tollAmount;

  // Beep ONLY when approaching within 5km AND balance is insufficient
  const needsBeep = isApproaching && isLowBalance;

  // Beep logic — only beep when balance is less than toll amount
  useEffect(() => {
    if (needsBeep && !muted) {
      startBeeping();
    } else {
      stopBeeping();
    }
    return () => {
      stopBeeping();
    };
  }, [needsBeep, muted, startBeeping, stopBeeping]);

  // Send state to service worker for background notifications
  useEffect(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "UPDATE_STATE",
        balance,
        vehicleType,
        nearestToll: nearestToll?.plaza.name ?? null,
        distanceKm: nearestToll?.distanceKm ?? 999,
      });
    }
  }, [balance, vehicleType, nearestToll]);

  // Auto toll deduction
  const deductingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (geo.latitude === null || geo.longitude === null) return;
    if (!nearestToll) return;

    const { plaza, distanceKm } = nearestToll;
    if (distanceKm > AUTO_DEDUCT_RADIUS_KM) return;

    const now = Date.now();
    const lastDeducted = recentlyDeducted.get(plaza.id);
    if (lastDeducted && now - lastDeducted < DEDUCT_COOLDOWN_MS) return;
    if (deductingRef.current.has(plaza.id)) return;

    deductingRef.current.add(plaza.id);
    recentlyDeducted.set(plaza.id, now);

    deductTollMut
      .mutateAsync({ plazaId: plaza.id, vehicleType })
      .then((success) => {
        if (success) {
          const newBal = balance - tollAmount;
          toast.success(`Toll deducted: ₹${tollAmount} at ${plaza.name}`);
          sendNotification(
            "FASTag Toll Alert",
            `Toll paid at ${plaza.name}. Remaining balance: ₹${newBal}`
          );
          refetchBalance();
          stopBeeping();
        } else {
          toast.error(`Insufficient balance at ${plaza.name}! Top up now.`);
        }
        deductingRef.current.delete(plaza.id);
      })
      .catch(() => {
        deductingRef.current.delete(plaza.id);
      });
  }, [geo.latitude, geo.longitude, nearestToll, vehicleType, balance, tollAmount, deductTollMut, refetchBalance, stopBeeping]);

  const balanceColor =
    balance > 500
      ? "text-balance-green glow-green"
      : balance > 100
      ? "text-balance-yellow glow-yellow"
      : "text-balance-red glow-red";

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Balance Card */}
      <div className="card-glass rounded-xl p-4 border-glow-cyan">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-rajdhani tracking-widest text-muted-foreground uppercase">
            FASTag Balance
          </span>
          <Badge
            variant="outline"
            className="text-xs font-mono-jb border-primary/30 text-primary"
          >
            {vehicleType}
          </Badge>
        </div>
        <div className={`font-mono-jb text-5xl font-bold tracking-tight ${balanceColor}`}>
          ₹{balance.toLocaleString("en-IN")}
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, (balance / 2000) * 100)}%`,
              background:
                balance > 500
                  ? "oklch(0.72 0.2 145)"
                  : balance > 100
                  ? "oklch(0.78 0.18 75)"
                  : "oklch(0.65 0.24 25)",
            }}
          />
        </div>
      </div>

      {/* Location Status */}
      {geo.error && (
        <div className="card-glass rounded-xl p-3 border border-destructive/40 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-sm text-destructive">{geo.error}</span>
        </div>
      )}

      {!geo.error && geo.isAcquiring && (
        <div className="card-glass rounded-xl p-3 flex items-center gap-2 border border-primary/20">
          <RefreshCw className="w-4 h-4 text-primary animate-spin shrink-0" />
          <span className="text-sm text-muted-foreground">Acquiring GPS signal...</span>
        </div>
      )}

      {!geo.error && !geo.isAcquiring && (
        <div className="card-glass rounded-xl p-3 flex items-center gap-2 border border-accent/20">
          <Wifi className="w-4 h-4 text-accent shrink-0" />
          <span className="text-xs text-muted-foreground font-mono-jb">
            {geo.latitude?.toFixed(4)}, {geo.longitude?.toFixed(4)}
            {geo.accuracy ? ` ±${Math.round(geo.accuracy)}m` : ""}
          </span>
        </div>
      )}

      {/* Approaching Alert */}
      {isApproaching && (
        <div
          className={`card-glass rounded-xl p-4 border-glow-red approaching-alert ${
            isLowBalance ? "border border-destructive/60" : "border border-yellow-500/40"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle
              className={`w-5 h-5 shrink-0 ${isLowBalance ? "text-destructive" : "text-yellow-400"}`}
            />
            <span className={`font-rajdhani font-bold text-base tracking-wide ${isLowBalance ? "text-destructive" : "text-yellow-400"}`}>
              {isLowBalance ? "LOW BALANCE — TOLL APPROACHING" : "TOLL APPROACHING"}
            </span>
          </div>
          <div className="text-sm text-foreground/80">
            <span className="font-semibold">{nearestToll?.plaza.name}</span>
            <span className="text-muted-foreground"> · {nearestToll?.plaza.highway}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              Required: <span className="text-foreground font-mono-jb font-bold">₹{tollAmount}</span>
            </span>
            {isLowBalance && (
              <span className="text-xs text-destructive font-semibold">
                Balance low! Recharge now
              </span>
            )}
          </div>

          {/* Stop Beep button — only shown when beep is active */}
          {(isBeeping || muted) && (
            <Button
              onClick={silenceBeep}
              variant="destructive"
              size="sm"
              className="mt-3 w-full font-rajdhani tracking-widest gap-2"
            >
              <BellOff className="w-4 h-4" />
              STOP BEEP ALERT
            </Button>
          )}
        </div>
      )}

      {/* Speedometer + Nearest Toll */}
      <div className="grid grid-cols-2 gap-3">
        {/* Speedometer */}
        <div className="card-glass rounded-xl p-3 flex flex-col items-center border border-border/50">
          <span className="text-xs font-rajdhani tracking-widest text-muted-foreground uppercase mb-1">
            Speed
          </span>
          <Speedometer speed={geo.speed} isAcquiring={geo.isAcquiring} />
        </div>

        {/* Nearest Toll */}
        <div className="card-glass rounded-xl p-3 flex flex-col border border-border/50">
          <span className="text-xs font-rajdhani tracking-widest text-muted-foreground uppercase mb-2">
            Nearest Toll
          </span>
          {plazasLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : nearestToll ? (
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-semibold leading-tight line-clamp-2">
                  {nearestToll.plaza.name}
                </span>
              </div>
              <Badge variant="outline" className="self-start text-xs border-primary/30 text-primary font-mono-jb">
                {nearestToll.plaza.highway}
              </Badge>
              <div className="mt-auto">
                <div className="flex items-center gap-1 text-primary">
                  <Navigation className="w-3.5 h-3.5" />
                  <span className="font-mono-jb font-bold text-lg glow-cyan">
                    {nearestToll.distanceKm < 1
                      ? `${Math.round(nearestToll.distanceKm * 1000)}m`
                      : `${nearestToll.distanceKm.toFixed(1)}km`}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Toll: <span className="text-foreground font-mono-jb">₹{tollAmount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground text-center">
              {geo.isAcquiring ? "Waiting for GPS..." : "No tolls found"}
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Type Selector */}
      <div className="card-glass rounded-xl p-4 border border-border/50">
        <span className="text-xs font-rajdhani tracking-widest text-muted-foreground uppercase block mb-3">
          Vehicle Type
        </span>
        <Select
          value={vehicleType}
          onValueChange={(val) => setVehicleTypeMut.mutate(val)}
        >
          <SelectTrigger className="bg-secondary/50 border-border/60 font-rajdhani text-base">
            <SelectValue placeholder="Select vehicle type" />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_TYPES.map((vt) => (
              <SelectItem key={vt} value={vt} className="font-rajdhani">
                {vt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Toll rates for current vehicle */}
        {nearestToll && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="text-xs text-muted-foreground mb-2">
              Toll rate at {nearestToll.plaza.name}:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {VEHICLE_TYPES.map((vt) => (
                <div
                  key={vt}
                  className={`rounded-lg p-2 text-center transition-all ${
                    vt === vehicleType
                      ? "bg-primary/10 border border-primary/40"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="text-xs text-muted-foreground leading-tight truncate">
                    {vt}
                  </div>
                  <div className="font-mono-jb text-sm font-bold text-foreground">
                    ₹{getTollRate(nearestToll.plaza, vt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All nearby tolls list */}
      {!geo.isAcquiring && geo.latitude !== null && (
        <div className="card-glass rounded-xl p-4 border border-border/50">
          <span className="text-xs font-rajdhani tracking-widest text-muted-foreground uppercase block mb-3">
            Nearby Toll Plazas
          </span>
          <div className="flex flex-col gap-2">
            {activePlazas
              .map((p) => ({
                ...p,
                distKm: haversine(geo.latitude!, geo.longitude!, p.latitude, p.longitude),
              }))
              .sort((a, b) => a.distKm - b.distKm)
              .slice(0, 5)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.highway}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="font-mono-jb text-sm font-bold text-primary">
                      {p.distKm < 1
                        ? `${Math.round(p.distKm * 1000)}m`
                        : `${p.distKm.toFixed(1)}km`}
                    </div>
                    <div className="text-xs text-muted-foreground">₹{getTollRate(p, vehicleType)}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
