"use client";

import { useEffect, useState, useCallback } from "react";
import { getToken, onMessage, MessagePayload } from "firebase/messaging";
import { messaging, VAPID_KEY } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useOrderStore } from "@/store/useOrderStore";
import { useOwnerStore } from "@/store/useOwnerStore";
import { useAdminStore } from "@/store/useAdminStore";
import { dispatchNotificationRefresh } from "@/lib/notification-events";

// ─── Deduplication ────────────────────────────────────────────────────────────
// Prevents the same FCM event from being processed twice (e.g., once via onMessage
// and once via the service-worker postMessage for the same order/status combo).

const _recentlyProcessed = new Map<string, number>(); // key → timestamp ms

function _isDuplicate(key: string): boolean {
  const now = Date.now();
  // Evict entries older than 15 s
  for (const [k, ts] of _recentlyProcessed.entries()) {
    if (now - ts > 15_000) _recentlyProcessed.delete(k);
  }
  if (_recentlyProcessed.has(key)) return true;
  _recentlyProcessed.set(key, now);
  return false;
}

// ─── Audio alarm ─────────────────────────────────────────────────────────────

// Module-level audio instance — persists across renders so we can stop it from anywhere
let newOrderAudio: HTMLAudioElement | null = null;

// Browsers block audio until the user has interacted with the page.
// We pre-create and silently play the audio element on first interaction
// so it's "unlocked" before any FCM message arrives.
let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  // Create and immediately pause a silent play to satisfy browser autoplay policy
  const silent = new Audio("/owner_notification.mp3");
  silent.volume = 0;
  silent.play().then(() => silent.pause()).catch(() => {});
}

// Attach unlock listener once (module-level, not per-component)
if (typeof window !== "undefined") {
  const unlock = () => { unlockAudio(); window.removeEventListener("click", unlock); window.removeEventListener("touchstart", unlock); };
  window.addEventListener("click", unlock, { once: true, passive: true });
  window.addEventListener("touchstart", unlock, { once: true, passive: true });
}

function startNewOrderAlarm() {
  try {
    if (newOrderAudio) {
      newOrderAudio.currentTime = 0;
      newOrderAudio.play().catch(() => {});
      return;
    }
    const audio = new Audio("/owner_notification.mp3");
    audio.loop = true;
    audio.volume = 1.0;
    newOrderAudio = audio;
    audio.play().catch((err) => {
      console.warn("[FCM] Audio play blocked — user has not interacted with page yet.", err);
    });
  } catch {
    // Audio not supported
  }
}

export function stopNewOrderAlarm() {
  if (newOrderAudio) {
    newOrderAudio.pause();
    newOrderAudio.currentTime = 0;
    newOrderAudio = null;
  }
}

export const useFcmToken = (userId: string | undefined) => {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission>("default");

  const registerToken = useCallback(async (fcmToken: string) => {
    const currentSession = useAuthStore.getState().session;
    if (!currentSession) return;

    try {
      const response = await fetch("/api/user/fcm-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({ token: fcmToken }),
      });
      if (!response.ok) throw new Error("Failed to register FCM token");
    } catch (err) {
      console.error("Error registering FCM token:", err);
    }
  }, []);

  useEffect(() => {
    if (!userId || typeof window === "undefined" || !messaging) return;

    const retrieveToken = async () => {
      try {
        if (!("serviceWorker" in navigator)) return;

        await navigator.serviceWorker.register("/api/firebase-sw", { scope: "/" });

        // Wait for an active service worker before calling getToken.
        const registration = await navigator.serviceWorker.ready;

        const getAndRegisterToken = async () => {
          const currentToken = await getToken(messaging!, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
          });
          if (currentToken) {
            setToken(currentToken);
            registerToken(currentToken);
          }
        };

        if (Notification.permission === "granted") {
          await getAndRegisterToken();
        } else if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          setNotificationPermissionStatus(permission);
          if (permission === "granted") {
            await getAndRegisterToken();
          }
        }
      } catch (error) {
        console.error("Error retrieving FCM token:", error);
      }
    };

    retrieveToken();

    const unsubscribe = onMessage(messaging!, (payload: MessagePayload) => {
      console.log("[useFcmToken] Received message:", payload);

      // Deduplicate: if SW already handled this (background→postMessage race), skip
      const orderId = payload.data?.orderId;
      const status  = payload.data?.status || payload.data?.orderStatus;
      const dedupKey = orderId ? `${orderId}:${status}` : `ts:${Date.now()}`;
      if (orderId && _isDuplicate(dedupKey)) {
        console.log("[useFcmToken] Duplicate message ignored:", dedupKey);
        return;
      }

      const isOrder = payload.data?.type === "ORDER";
      const isNewOrder = isOrder && (payload.data?.status === "PENDING_CONFIRMATION" || !payload.data?.status);
      const role = useAuthStore.getState().role;
      const incomingTitle = payload.data?.title || payload.notification?.title || "";
      const incomingBody = payload.data?.body || payload.notification?.body || "";
      const targetRole = payload.data?.targetRole; // 'owner' or 'customer'

      // Determine if this is a merchant-specific alert based on metadata or current role fallback
      const isMerchantAlert = targetRole
        ? (targetRole === "owner" || targetRole === "admin")
        : (role === "owner" || role === "admin");

      const toastContent = (() => {
        // High priority: If we have an explicit targetRole and it's merchant, we might want to standardize
        // generic statuses like PENDING_CONFIRMATION for a cleaner UI, BUT we should still prefer server text.
        if (isMerchantAlert) {
          // Fallback logic for merchant alerts
          if (isNewOrder) {
            return {
              title: incomingTitle || "New order received",
              description: incomingBody || "A customer placed a new order.",
            };
          }
          const orderStatus = payload.data?.status;
          if (orderStatus === "PAID") {
            return {
              title: incomingTitle || "Payment received",
              description: incomingBody || "An order payment was confirmed.",
            };
          }
          return {
            title: incomingTitle || "Order update",
            description: incomingBody || "An order status was updated.",
          };
        }

        // Customer or un-flagged alert: always trust the server's copy entirely
        return {
          title: incomingTitle || "Live Update",
          description: incomingBody || "A live order update was received.",
        };
      })();

      if (isNewOrder && isMerchantAlert) {
        // New order arrived — loop the alarm until owner acts
        startNewOrderAlarm();
      } else if (isMerchantAlert) {
        // Owner acted on an order (CONFIRMED, CANCELLED, PAID, etc.) — stop alarm
        stopNewOrderAlarm();
      }

      if (status === "PENDING_CONFIRMATION") {
        toast(toastContent.title, {
          description: toastContent.description,
          duration: 4000,
        });
      } else if (isMerchantAlert) {
        toast(toastContent.title, {
          description: toastContent.description,
          duration: 3000,
        });
      } else {
        toast.success(toastContent.title, {
          description: toastContent.description,
          duration: 3000,
        });
      }

      if (isOrder) {
        const orderId = payload.data?.orderId;
        const status = payload.data?.status || payload.data?.orderStatus;

        console.log(`[useFcmToken] Order update detected. ID: ${orderId}, Status: ${status}, TargetRole: ${targetRole}`);

        if (orderId && status) {
          // Customer order store — silent refresh so the list updates without a spinner
          if (targetRole !== "owner" && targetRole !== "admin") {
            console.log(`[useFcmToken] Silent-refreshing customer orders for ${orderId} → ${status}`);
            useOrderStore.getState().silentRefreshOrders();
          }

          // Owner store — always sync owner/admin dashboards from live order updates.
          // A full refresh is safer than suppressing owner-targeted events because
          // kitchen cards depend on complete server data, not just the changed status.
          if ((role === "owner" || role === "admin")) {
            console.log(`[useFcmToken] Refreshing Owner Store for ${orderId}`);
            useOwnerStore.getState().refreshOrders();
          }

          // Admin store — only if the user is an admin (avoids 403 for owners)
          if (role === "admin" && targetRole !== "admin") {
            useAdminStore.getState().updateSingleOrder({ id: orderId, status });
          }
        } else {
          useOrderStore.getState().refreshOrders();
          if (role === "owner" || role === "admin") {
            useOwnerStore.getState().refreshOrders();
          }
          if (role === "admin") {
            useAdminStore.getState().refreshOrders();
          }
        }
      }

      dispatchNotificationRefresh();
    });

    return () => unsubscribe();
  }, [userId, registerToken]);

  // ── SW background-message bridge ──────────────────────────────────────────
  // When the owner's tab is in the background, Firebase delivers the FCM message
  // to the service worker (onBackgroundMessage) instead of onMessage.  The SW
  // postMessages every open tab so we can play the alarm and refresh instantly
  // without waiting for the user to click the system notification.
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.serviceWorker) return;

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type !== "FCM_BACKGROUND_MESSAGE") return;

      const data: Record<string, string> = event.data.data ?? {};
      const orderId = data.orderId;
      const status  = data.status || data.orderStatus;
      const dedupKey = orderId ? `${orderId}:${status}` : `sw:${Date.now()}`;

      // Guard: if onMessage already processed this, skip
      if (orderId && _isDuplicate(dedupKey)) {
        console.log("[useFcmToken] SW postMessage duplicate ignored:", dedupKey);
        return;
      }

      console.log("[useFcmToken] SW background message received:", data);

      const role        = useAuthStore.getState().role;
      const targetRole  = data.targetRole;
      const isNewOrder  = status === "PENDING_CONFIRMATION";
      const isMerchant  = targetRole ? (targetRole === "owner" || targetRole === "admin") : (role === "owner" || role === "admin");

      // Play alarm for new orders targeting owner/admin
      if (isNewOrder && isMerchant) {
        startNewOrderAlarm();
      }

      // Refresh the correct store
      if (data.type === "ORDER" || !data.type) {
        if (isMerchant || role === "owner" || role === "admin") {
          useOwnerStore.getState().refreshOrders();
        }
        if (targetRole !== "owner" && targetRole !== "admin") {
          useOrderStore.getState().silentRefreshOrders();
        }
        if (role === "admin") {
          if (orderId && status) {
            useAdminStore.getState().updateSingleOrder({ id: orderId, status });
          } else {
            useAdminStore.getState().refreshOrders();
          }
        }
      }

      dispatchNotificationRefresh();
    };

    navigator.serviceWorker.addEventListener("message", handleSwMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleSwMessage);
  }, []);

  return { token, notificationPermissionStatus };
};
