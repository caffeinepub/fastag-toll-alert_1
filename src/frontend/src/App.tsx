import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Bell,
  BellOff,
  History,
  LayoutDashboard,
  Radio,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardTab } from "./components/DashboardTab";
import { HistoryTab } from "./components/HistoryTab";
import { RechargeTab } from "./components/RechargeTab";
import { useActorRegistry, useActorSync } from "./hooks/useQueries";
import { useWakeLock } from "./hooks/useWakeLock";

type Tab = "dashboard" | "recharge" | "history";

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "recharge", label: "Recharge", Icon: Zap },
  { id: "history", label: "History", Icon: History },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { isActive: wakeLockActive } = useWakeLock();
  // Keep the actor singleton in sync so mutations always have a live actor reference
  useActorSync();
  // Register actor in shared module-level registry for all mutation hooks
  useActorRegistry();

  // Notification permission state
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >("Notification" in window ? Notification.permission : "unsupported");
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(
    () => localStorage.getItem("notif_banner_dismissed") === "1",
  );

  // Poll permission state in case it changes externally
  useEffect(() => {
    if (!("Notification" in window)) return;
    const interval = setInterval(() => {
      setNotifPermission(Notification.permission);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      new Notification("FASTag Toll Alert", {
        body: "Notifications enabled! You will be alerted after every toll crossing.",
        icon: "/favicon.ico",
        tag: "fastag-welcome",
      });
    }
  };

  const dismissNotifBanner = () => {
    setNotifBannerDismissed(true);
    localStorage.setItem("notif_banner_dismissed", "1");
  };

  const showNotifBanner =
    notifPermission !== "unsupported" &&
    notifPermission !== "granted" &&
    !notifBannerDismissed;

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% -20%, oklch(0.2 0.04 220 / 0.3), transparent),
          radial-gradient(ellipse 60% 40% at 80% 80%, oklch(0.15 0.03 260 / 0.2), transparent),
          oklch(0.09 0.008 265)
        `,
      }}
    >
      {/* App wrapper — mobile-first max width */}
      <div className="w-full max-w-[430px] flex flex-col min-h-screen relative">
        {/* Header */}
        <header
          className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-border/40"
          style={{
            background: "oklch(0.09 0.01 265 / 0.9)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "oklch(0.82 0.18 195 / 0.15)",
                border: "1px solid oklch(0.82 0.18 195 / 0.3)",
              }}
            >
              <Radio
                className="w-4 h-4"
                style={{ color: "oklch(0.82 0.18 195)" }}
              />
            </div>
            <div>
              <div className="font-rajdhani font-bold text-sm tracking-wider text-foreground leading-none">
                FASTAG TOLL
              </div>
              <div
                className="font-rajdhani text-xs tracking-widest leading-none mt-0.5"
                style={{ color: "oklch(0.82 0.18 195)" }}
              >
                ALERT SYSTEM
              </div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-2">
            {/* Notification permission indicator */}
            {notifPermission === "granted" ? (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-full"
                style={{
                  background: "oklch(0.72 0.2 145 / 0.1)",
                  border: "1px solid oklch(0.72 0.2 145 / 0.3)",
                }}
                title="Notifications enabled"
              >
                <Bell
                  className="w-3 h-3"
                  style={{ color: "oklch(0.72 0.2 145)" }}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="flex items-center gap-1 px-2 py-1 rounded-full transition-all hover:opacity-80"
                style={{
                  background: "oklch(0.78 0.18 75 / 0.15)",
                  border: "1px solid oklch(0.78 0.18 75 / 0.4)",
                }}
                title="Tap to allow notifications"
              >
                <BellOff
                  className="w-3 h-3"
                  style={{ color: "oklch(0.78 0.18 75)" }}
                />
              </button>
            )}

            {/* Wake lock indicator — shown when screen is kept on */}
            {wakeLockActive && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-full"
                style={{
                  background: "oklch(0.82 0.18 195 / 0.1)",
                  border: "1px solid oklch(0.82 0.18 195 / 0.25)",
                }}
                title="Screen kept on while driving"
              >
                <ShieldCheck
                  className="w-3 h-3"
                  style={{ color: "oklch(0.82 0.18 195)" }}
                />
              </div>
            )}

            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-500/30 bg-green-500/10">
              <span
                className="w-1.5 h-1.5 rounded-full bg-green-500"
                style={{ animation: "pulse 2s infinite" }}
              />
              <span
                className="text-xs font-rajdhani font-semibold tracking-widest"
                style={{ color: "oklch(0.72 0.2 145)" }}
              >
                LIVE
              </span>
            </div>
          </div>
        </header>

        {/* Notification Permission Banner */}
        {showNotifBanner && (
          <div
            className="flex items-center gap-3 px-4 py-3 border-b"
            style={{
              background: "oklch(0.18 0.06 60 / 0.95)",
              borderColor: "oklch(0.78 0.18 75 / 0.4)",
            }}
          >
            <Bell
              className="w-5 h-5 shrink-0"
              style={{ color: "oklch(0.78 0.18 75)" }}
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-rajdhani font-bold tracking-wide"
                style={{ color: "oklch(0.78 0.18 75)" }}
              >
                ALLOW NOTIFICATIONS
              </div>
              <div className="text-xs text-muted-foreground leading-tight">
                Get alerts after every toll crossing
              </div>
            </div>
            <Button
              size="sm"
              onClick={requestNotificationPermission}
              className="shrink-0 font-rajdhani font-bold tracking-wider text-xs px-3 h-8"
              style={{
                background: "oklch(0.78 0.18 75)",
                color: "oklch(0.1 0.01 260)",
              }}
            >
              {notifPermission === "denied" ? "BLOCKED" : "ALLOW"}
            </Button>
            <button
              type="button"
              onClick={dismissNotifBanner}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Notification blocked notice */}
        {notifPermission === "denied" && !notifBannerDismissed && (
          <div
            className="flex items-center gap-3 px-4 py-2 border-b"
            style={{
              background: "oklch(0.15 0.04 25 / 0.9)",
              borderColor: "oklch(0.65 0.24 25 / 0.4)",
            }}
          >
            <BellOff className="w-4 h-4 shrink-0 text-destructive" />
            <span className="text-xs text-destructive flex-1">
              Notifications blocked. Enable in phone Settings &gt; Apps &gt;
              FASTag Toll Alert &gt; Notifications
            </span>
            <button
              type="button"
              onClick={dismissNotifBanner}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 pt-4">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "recharge" && <RechargeTab />}
          {activeTab === "history" && <HistoryTab />}
        </main>

        {/* Bottom Tab Navigation */}
        <nav
          className="sticky bottom-0 z-50 flex border-t border-border/40"
          style={{
            background: "oklch(0.09 0.01 265 / 0.95)",
            backdropFilter: "blur(16px)",
          }}
        >
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                type="button"
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-1 pt-3 pb-4 transition-all duration-200 ${
                  isActive ? "tab-active" : "tab-inactive"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className="w-5 h-5 transition-all"
                  style={
                    isActive
                      ? {
                          color: "oklch(0.82 0.18 195)",
                          filter:
                            "drop-shadow(0 0 6px oklch(0.82 0.18 195 / 0.6))",
                        }
                      : { color: "oklch(0.5 0.02 240)" }
                  }
                />
                <span
                  className="text-xs font-rajdhani font-semibold tracking-widest"
                  style={
                    isActive
                      ? { color: "oklch(0.82 0.18 195)" }
                      : { color: "oklch(0.5 0.02 240)" }
                  }
                >
                  {label.toUpperCase()}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <footer className="text-center py-2 text-xs text-muted-foreground/50 font-rajdhani tracking-wide border-t border-border/20">
          Created by ROHAN SILAMBARASAN
        </footer>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.15 0.02 260)",
            border: "1px solid oklch(0.3 0.04 250 / 0.6)",
            color: "oklch(0.95 0.01 220)",
          },
        }}
      />
    </div>
  );
}
