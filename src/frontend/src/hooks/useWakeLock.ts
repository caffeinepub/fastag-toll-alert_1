import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Requests a Screen Wake Lock so the browser doesn't dim/sleep
 * while the user is driving toward a toll.
 *
 * - Automatically re-acquires when the page becomes visible again.
 * - Silently ignores browsers that don't support the API.
 */
export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      // Release any stale lock first
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch (_) {}
        wakeLockRef.current = null;
      }
      type WakeLockNav = Navigator & {
        wakeLock: { request(type: string): Promise<WakeLockSentinel> };
      };
      wakeLockRef.current = await (navigator as WakeLockNav).wakeLock.request(
        "screen",
      );
      setIsActive(true);
      wakeLockRef.current.addEventListener("release", () => {
        setIsActive(false);
        wakeLockRef.current = null;
      });
    } catch (_) {
      // Wake Lock API may be denied by permissions policy or in certain browser modes
      setIsActive(false);
    }
  }, []);

  useEffect(() => {
    acquire();

    // Re-acquire when user comes back to the tab/page
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        acquire();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      // Release on unmount
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [acquire]);

  return { isActive };
}
