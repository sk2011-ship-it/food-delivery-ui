/**
 * api.types.ts - Shared TypeScript interfaces for all API communications.
 */

export type UserRole = "customer" | "driver" | "owner" | "admin";
export type UserStatus = "active" | "banned";
export type RestaurantStatus = "active" | "inactive" | "suspended";
export type MenuItemStatus = "available" | "unavailable";
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DayHours = { open: string; close: string } | null;
export type OpeningHours = Partial<Record<DayKey, DayHours>>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface RestaurantItem {
  id: string;
  name: string;
  location: string | null;
  logoUrl: string | null;
  image?: string | null; // Compatibility field
  cuisine?: string | null;
  rating?: string | number | null;
  reviews?: number | null;
  deliveryTime?: string | null;
  deliveryFee?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  isMobileChef?: boolean;
  ownerId: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  managerPhone?: string | null;
  contactEmail: string;
  contactPhone: string;
  businessRegNo?: string | null;
  openingHours: OpeningHours | null;
  status: RestaurantStatus;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  name: string;
  description: string | null;
  category: string;
  price: number | string;
  status: MenuItemStatus;
  imageUrl: string;
  createdAt: string;
}

export interface FeaturedItem {
  id: string;
  entityId: string;
  type: "restaurant" | "dish";
  name: string;
  location?: string | null;
  logoUrl?: string | null;
  imageUrl?: string | null;
  restaurantName?: string;
  restaurantId?: string;
  price?: number;
  category?: string;
  openingHours?: OpeningHours | null;
  sortOrder: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  name: string;
  imageUrl: string;
  restaurantName: string;
  restaurantId: string;
}

export interface Order {
  id: string;
  userId: string | null;
  restaurantId: string;
  status: string;
  sessionId?: string | null;
  totalAmount: string;
  deliveryFee: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  paymentIntentId?: string | null;
  confirmedAt?: string | null;
  paidAt?: string | null;
  restaurant?: { name: string };
  deliveryJob?: {
    status: string | null;
    trackingUrl: string | null;
    driverName: string | null;
    driverPhone: string | null;
    eta: string | null;
  };
  review?: Review | null;
  items?: {
    id: string;
    quantity: number;
    price: string;
    menuItem: { id: string; name: string; imageUrl?: string };
  }[];
}

export type FeaturedType = "restaurant" | "dish";
export type FeaturedStatus = "active" | "inactive";

export interface Review {
  id: string;
  userId: string | null;
  restaurantId: string;
  orderId: string;
  rating: number;
  comment: string | null;
  status: "active" | "inactive" | "ban";
  createdAt: string;
  userName?: string;
}

export interface FeaturedPayload {
  type: FeaturedType;
  entityId: string;
  location: string;
  status?: FeaturedStatus;
  sortOrder?: number;
}
