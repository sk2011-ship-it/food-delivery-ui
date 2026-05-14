"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useOrderTimer - A hook to manage a countdown for orders.
 * @param createdAt - The creation timestamp of the order.
 * @param timeoutMinutes - Duration of the timer (default 10).
 * @param onExpire - Callback function when time runs out.
 */
export function useOrderTimer(
  createdAt: string,
  timeoutMinutes: number = 10,
  onExpire?: () => void
  ) {
  const getInitialTimeLeft = () => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const duration = timeoutMinutes * 60 * 1000;
    return Math.floor(Math.max(0, duration - (now - start)) / 1000);
  };

  const [timeLeft, setTimeLeft] = useState<number>(getInitialTimeLeft);
  const [isExpired, setIsExpired] = useState(() => getInitialTimeLeft() <= 0);
  const expireCalledRef = useRef(false);

  const calculateTimeLeft = useCallback(() => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    const duration = timeoutMinutes * 60 * 1000;
    const remaining = Math.max(0, duration - diff);
    
    return Math.floor(remaining / 1000);
  }, [createdAt, timeoutMinutes]);

  useEffect(() => {
    expireCalledRef.current = false;
    const initial = calculateTimeLeft();

    if (initial <= 0 && !isExpired) {
      if (!expireCalledRef.current) {
        expireCalledRef.current = true;
        onExpire?.();
      }
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        if (!isExpired && !expireCalledRef.current) {
          expireCalledRef.current = true;
          setIsExpired(true);
          onExpire?.();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, onExpire, isExpired]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return {
    timeLeft,
    isExpired,
    formattedTime: formatTime(timeLeft),
  };
}
