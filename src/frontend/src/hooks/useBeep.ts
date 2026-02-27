import { useRef, useCallback, useEffect, useState } from "react";

/**
 * Continuous beep using Web Audio API.
 * Beep pattern: 0.4s on / 0.3s off at 880 Hz, loud volume.
 * The beep is always armed — caller decides when to start/stop.
 */
export function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isBeeping, setIsBeeping] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playBeep = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = getCtx();
      if (ctx.state === "suspended") ctx.resume();

      // Layer two oscillators for a louder, more piercing alert sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.type = "square";
      osc1.frequency.setValueAtTime(880, ctx.currentTime);

      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(1100, ctx.currentTime);

      // Full volume (1.0) with a short decay for sharp alert sound
      gain.gain.setValueAtTime(1.0, ctx.currentTime);
      gain.gain.setValueAtTime(1.0, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.45);

      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (_) {
      // Audio may fail silently in some browsers
    }
  }, [getCtx]);

  const startBeeping = useCallback(() => {
    if (intervalRef.current) return;
    setIsBeeping(true);
    playBeep();
    intervalRef.current = setInterval(playBeep, 750); // 450ms on + 300ms gap
  }, [playBeep]);

  const stopBeeping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsBeeping(false);
  }, []);

  const silenceBeep = useCallback(() => {
    mutedRef.current = true;
    setMuted(true);
    stopBeeping();
  }, [stopBeeping]);

  const unmute = useCallback(() => {
    mutedRef.current = false;
    setMuted(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBeeping();
      if (ctxRef.current) {
        ctxRef.current.close();
      }
    };
  }, [stopBeeping]);

  return { isBeeping, muted, startBeeping, stopBeeping, silenceBeep, unmute };
}
