export const NOTIFICATION_REFRESH_EVENT = "app:notifications:refresh";

export function dispatchNotificationRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATION_REFRESH_EVENT));
}
