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

// Module-level audio instance — persists across renders so we can stop it from anywhere
let newOrderAudio: HTMLAudioElement | null = null;

function startNewOrderAlarm() {
  try {
    if (newOrderAudio) {
      // Already playing — just ensure it keeps looping
      newOrderAudio.currentTime = 0;
      newOrderAudio.play().catch(() => {});
      return;
    }
    const audio = new Audio("/owner_notification.mp3");
    audio.loop = true;
    audio.volume = 1.0;
    newOrderAudio = audio;
    audio.play().catch(() => {});
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

        await navigator.serviceWorker.register("/firebase-messaging-sw.js");

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

      const status = payload.data?.status || payload.data?.orderStatus;
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
          // Customer order store
          if (targetRole !== "owner" && targetRole !== "admin") {
            console.log(`[useFcmToken] Updating Customer Order Store for ${orderId}`);
            useOrderStore.getState().updateSingleOrder({ id: orderId, status });
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

  return { token, notificationPermissionStatus };
};
