type NotificationLike = {
  createdAt: string;
};

const LAST_SEEN_PREFIX = "food-delivery-ui:notifications:last-seen";

function storageKey(userId: string) {
  return `${LAST_SEEN_PREFIX}:${userId}`;
}

function toMillis(value: string | number | Date) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function getLastSeenNotificationAt(userId: string) {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(storageKey(userId));
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setLastSeenNotificationAt(userId: string, value: string | number | Date) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), String(toMillis(value)));
}

export function markNotificationsSeen(userId: string, notifications: NotificationLike[]) {
  if (notifications.length === 0) {
    setLastSeenNotificationAt(userId, Date.now());
    return;
  }

  setLastSeenNotificationAt(userId, notifications[0].createdAt);
}

export function getUnreadNotificationCount(userId: string, notifications: NotificationLike[]) {
  const lastSeenAt = getLastSeenNotificationAt(userId);
  if (lastSeenAt === null) return notifications.length;

  return notifications.filter((notification) => {
    const createdAt = Date.parse(notification.createdAt);
    return Number.isFinite(createdAt) && createdAt > lastSeenAt;
  }).length;
}
