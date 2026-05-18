"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useOrderTimer — countdown from an anchor timestamp.
 *
 * @param anchorTime     ISO timestamp to count from (e.g. confirmedAt, paidAt, createdAt)
 * @param timeoutMinutes How many minutes the window lasts
 * @param onExpire       Called once when the timer hits zero (stable ref — safe to inline)
 */
export function useOrderTimer(
  anchorTime: string | null | undefined,
  timeoutMinutes: number = 10,
  onExpire?: () => void,
) {
  const getSecondsLeft = useCallback(() => {
    if (!anchorTime) return 0;
    const elapsed = Date.now() - new Date(anchorTime).getTime();
    const total   = timeoutMinutes * 60 * 1000;
    return Math.max(0, Math.floor((total - elapsed) / 1000));
  }, [anchorTime, timeoutMinutes]);

  const [timeLeft,  setTimeLeft]  = useState(() => getSecondsLeft());
  const [isExpired, setIsExpired] = useState(() => getSecondsLeft() <= 0);

  // Keep onExpire fresh without it being a dep (avoids re-creating the interval on every render)
  const onExpireRef = useRef(onExpire);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // Fired-flag lives outside state so it never triggers a re-render loop
  const firedRef = useRef(false);

  useEffect(() => {
    // Reset whenever the anchor or duration changes
    firedRef.current = false;

    const initial = getSecondsLeft();
    setTimeLeft(initial);
    setIsExpired(initial <= 0);

    if (initial <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
      }
      return;
    }

    const id = setInterval(() => {
      const left = getSecondsLeft();
      setTimeLeft(left);

      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        setIsExpired(true);
        clearInterval(id);
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [getSecondsLeft]); // ← only re-runs when anchor/timeout change, NOT when isExpired changes

  return {
    timeLeft,
    isExpired,
    formattedTime: `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`,
  };
}
