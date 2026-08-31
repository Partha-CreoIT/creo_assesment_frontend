"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Server-authoritative countdown: syncs to the backend clock via serverNow,
 * ticks locally, and fires onExpire exactly once at zero.
 */
export function useExamTimer(
  endsAt: string | undefined,
  serverNow: string | undefined,
  onExpire: () => void
) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!endsAt || !serverNow) return;
    const offset = new Date(serverNow).getTime() - Date.now();
    const end = new Date(endsAt).getTime();

    const tick = () => {
      const rem = (end - (Date.now() + offset)) / 1000;
      setRemaining(rem);
      if (rem <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endsAt, serverNow]);

  return remaining;
}
