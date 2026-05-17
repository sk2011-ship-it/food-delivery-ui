/**
 * api.ts — typed client-side fetch wrapper for all API calls.
 */

export interface ApiResponse<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin" | "driver" | "owner";
}

export interface RegisterResponse extends AuthUser {
  needsEmailVerification: boolean;
}

export type UserRole = "customer" | "driver" | "owner" | "admin";
export type UserStatus = "active" | "banned";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface AdminUserListResponse {
  users: AdminUserItem[];
  total: number;
  page: number;
  pageSize: number;
}

/* ── HTTP helpers ── */

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    const text = await res.text();
    if (!text) return { success: false, error: "Server returned an empty response." };
    const json = JSON.parse(text);
    if (!res.ok) return { success: false, error: json.error ?? "Something went wrong." };
    return { success: true, data: json.data };
  } catch {
    return { success: false, error: "Invalid response from server." };
  }
}

async function post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    return parseResponse<T>(res);
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

async function get<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, { credentials: "same-origin" });
    return parseResponse<T>(res);
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

async function put<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    return parseResponse<T>(res);
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

async function del<T = null>(url: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, { method: "DELETE", credentials: "same-origin" });
    return parseResponse<T>(res);
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

/* ── Auth API ── */

export const authApi = {
  login(email: string, password: string) {
    return post<AuthUser>("/api/auth/login", { email, password });
  },
  register(payload: { name: string; email: string; phone: string; password: string }) {
    return post<RegisterResponse>("/api/auth/register", payload);
  },
  logout() {
    return post<null>("/api/auth/logout", {});
  },
  getMe() {
    return get<AuthUser>("/api/auth/me");
  },
  deleteAccount() {
    return del<{ message: string }>("/api/customer/account");
  },
  clearFcmToken() {
    return del<null>("/api/user/fcm-token");
  },
};

/* ── Admin: Restaurant Management API ── */

import type { 
  RestaurantStatus, 
  DayKey, 
  DayHours, 
  OpeningHours, 
  RestaurantItem as API_RestaurantItem,
  MenuItem as API_MenuItem,
  Review as API_Review
} from "@/types/api.types";

export type { 
  RestaurantStatus, 
  DayKey, 
  DayHours, 
  OpeningHours, 
};

export interface AdminRestaurantItem {
  id: string;
  name: string;
  location: string | null;
  logoUrl: string | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  managerPhone: string | null;
  contactEmail: string;
  contactPhone: string;
  businessRegNo: string | null;
  openingHours: OpeningHours | null;
  status: RestaurantStatus;
  deletionStatus: "PENDING_DELETION" | "DELETED" | null;
  deletionRequestedAt: string | null;
  deletionScheduledAt: string | null;
  isActive: boolean;
  isMobileChef: boolean;
  createdAt: string;
}

export interface AdminRestaurantListResponse {
  restaurants: AdminRestaurantItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListRestaurantsParams {
  search?: string;
  status?: string;
  location?: string;
  sort?: "name" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
  includeDeletions?: boolean;
}

export interface RestaurantPayload {
  name: string;
  location?: string;
  logoUrl?: string;
  ownerId: string;
  managerPhone?: string;
  contactEmail: string;
  contactPhone: string;
  businessRegNo?: string;
  openingHours?: OpeningHours;
  status?: RestaurantStatus;
  isMobileChef?: boolean;
}

export const restaurantApi = {
  list(params: ListRestaurantsParams = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.status) qs.set("status", params.status);
    if (params.location) qs.set("location", params.location);
    if (params.sort) qs.set("sort", params.sort);
    if (params.order) qs.set("order", params.order);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.includeDeletions) qs.set("includeDeletions", "true");
    return get<AdminRestaurantListResponse>(`/api/admin/restaurants?${qs.toString()}`);
  },

  create(payload: RestaurantPayload) {
    return post<AdminRestaurantItem>("/api/admin/restaurants", payload);
  },

  update(id: string, payload: Partial<RestaurantPayload>) {
    return put<AdminRestaurantItem>(`/api/admin/restaurants/${id}`, payload);
  },

  delete(id: string) {
    return del<{ message: string }>(`/api/admin/restaurants/${id}/delete`);
  },

  forceDelete(id: string) {
    return del<{ id: string }>(`/api/admin/restaurants/${id}`);
  },

  getPublic(id: string) {
    return get<AdminRestaurantItem>(`/api/restaurants/${id}`);
  },

  listPublic(params: { location: string; category?: string }) {
    const qs = new URLSearchParams({ location: params.location });
    if (params.category) qs.set("category", params.category);
    return get<{ items: AdminRestaurantItem[] }>(`/api/restaurants?${qs.toString()}`);
  },
};

/* ── Admin: User Management API ── */

export interface ListUsersParams {
  search?: string;
  role?: string;
  status?: string;
  sort?: "name" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export const adminApi = {
  listUsers(params: ListUsersParams = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.role) qs.set("role", params.role);
    if (params.status) qs.set("status", params.status);
    if (params.sort) qs.set("sort", params.sort);
    if (params.order) qs.set("order", params.order);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return get<AdminUserListResponse>(`/api/admin/users?${qs.toString()}`);
  },

  createUser(payload: { name: string; email: string; phone: string; role: UserRole; password: string }) {
    return post<AdminUserItem>("/api/admin/users", payload);
  },

  updateUser(id: string, payload: { name?: string; phone?: string; role?: UserRole; status?: UserStatus }) {
    return put<AdminUserItem>(`/api/admin/users/${id}`, payload);
  },

  deleteUser(id: string) {
    return del<{ id: string }>(`/api/admin/users/${id}`);
  },
};

/* ── Admin: Menu Management API ── */

export type MenuItemStatus = "available" | "unavailable";

export interface AdminMenuItemResponse {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLocation: string | null;
  name: string;
  description: string | null;
  category: string;
  price: number | string;
  status: MenuItemStatus;
  imageUrl: string;
  createdAt: string;
}

export interface DishListResponse {
  items: AdminMenuItemResponse[];
}

export interface AdminMenuListResponse {
  items: AdminMenuItemResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListMenuParams {
  search?: string;
  restaurantId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface MenuItemPayload {
  restaurantId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  status?: MenuItemStatus;
  imageUrl: string;
}

export const menuApi = {
  list(params: ListMenuParams = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.restaurantId) qs.set("restaurantId", params.restaurantId);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return get<AdminMenuListResponse>(`/api/admin/menu?${qs.toString()}`);
  },

  create(payload: MenuItemPayload) {
    return post<AdminMenuItemResponse>("/api/admin/menu", payload);
  },

  update(id: string, payload: Partial<MenuItemPayload>) {
    return put<AdminMenuItemResponse>(`/api/admin/menu/${id}`, payload);
  },

  delete(id: string) {
    return del<{ id: string }>(`/api/admin/menu/${id}`);
  },
};

export const dishesApi = {
  list(params: { location: string; search?: string; category?: string; limit?: number }) {
    const qs = new URLSearchParams({ location: params.location });
    if (params.search) qs.set("search", params.search);
    if (params.category) qs.set("category", params.category);
    if (params.limit) qs.set("limit", String(params.limit));
    return get<DishListResponse>(`/api/dishes?${qs.toString()}`);
  },
  getOne(id: string) {
    // We'll reuse the public restaurant item API for this or create a new one
    return get<AdminMenuItemResponse>(`/api/dishes/${id}`);
  }
};

/* ── Public Featured API ── */

export interface PublicFeaturedRestaurant {
  id: string;
  entityId: string;
  type: "restaurant";
  name: string;
  location: string | null;
  logoUrl: string | null;
  sortOrder: number;
}

export interface PublicFeaturedDish {
  id: string;
  entityId: string;
  type: "dish";
  name: string;
  restaurantName: string;
  restaurantId: string;
  openingHours?: OpeningHours | null;
  price: number;
  imageUrl: string;
  category: string;
  sortOrder: number;
}

export const featuredApi = {
  listRestaurants(location: string) {
    return get<{ items: PublicFeaturedRestaurant[] }>(
      `/api/featured?location=${encodeURIComponent(location)}&type=restaurant`
    );
  },
  listDishes(location: string, restaurantId?: string) {
    const qs = new URLSearchParams({ location, type: "dish" });
    if (restaurantId) qs.set("restaurantId", restaurantId);
    return get<{ items: PublicFeaturedDish[] }>(`/api/featured?${qs.toString()}`);
  },
};

/* ── Admin: Featured Management API ── */

export type FeaturedType = "restaurant" | "dish";
export type FeaturedStatus = "active" | "inactive";

export interface AdminFeaturedItem {
  id: string;
  type: FeaturedType;
  entityId: string;
  entityName: string;
  location: string;
  status: FeaturedStatus;
  sortOrder: number;
  createdAt: string;
}

export interface AdminFeaturedListResponse {
  items: AdminFeaturedItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FeaturedPayload {
  type: FeaturedType;
  entityId: string;
  location: string;
  status?: FeaturedStatus;
  sortOrder?: number;
}

export const adminFeaturedApi = {
  list(params: { location?: string; type?: string; status?: string; page?: number; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.location) qs.set("location", params.location);
    if (params.type) qs.set("type", params.type);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return get<AdminFeaturedListResponse>(`/api/admin/featured?${qs.toString()}`);
  },
  create(payload: FeaturedPayload) {
    return post<AdminFeaturedItem>("/api/admin/featured", payload);
  },
  update(id: string, payload: { status?: FeaturedStatus; sortOrder?: number }) {
    return put<AdminFeaturedItem>(`/api/admin/featured/${id}`, payload);
  },
  delete(id: string) {
    return del<{ id: string }>(`/api/admin/featured/${id}`);
  },
};

/* ── Owner: Restaurant Management API ── */

export const ownerRestaurantApi = {
  list() {
    return get<{ items: AdminRestaurantItem[] }>("/api/owner/restaurants");
  },
  get(id: string) {
    return get<AdminRestaurantItem>(`/api/owner/restaurants/${id}`);
  },
  update(id: string, payload: Partial<RestaurantPayload>) {
    return put<AdminRestaurantItem>(`/api/owner/restaurants/${id}`, payload);
  },
  requestDeletion(id: string) {
    return post<{ message: string }>(`/api/owner/restaurants/${id}/delete`, {});
  },
  restore(id: string) {
    return post<{ message: string }>(`/api/owner/restaurants/${id}/restore`, {});
  },
};

export const ownerMenuApi = {
  list() {
    return get<{ items: AdminMenuItemResponse[] }>("/api/owner/menu");
  },
  create(payload: MenuItemPayload) {
    return post<AdminMenuItemResponse>("/api/owner/menu", payload);
  },
  update(id: string, payload: Partial<MenuItemPayload>) {
    return put<AdminMenuItemResponse>(`/api/owner/menu/${id}`, payload);
  },
  delete(id: string) {
    return del<{ id: string }>(`/api/owner/menu/${id}`);
  },
};

/* ── Admin: Payments & Settlements API ── */

export interface SettlementSummary {
  restaurants: (AdminRestaurantItem & {
    totalEarned: number;
    totalPaid: number;
    pendingBalance: number;
    orderCount: number;
  })[];
  platformSummary: {
    totalPendingPayouts: number;
    totalPlatformRevenue: number;
    totalSettled: number;
  };
}

export interface UnpaidOrdersDetail {
  restaurant: AdminRestaurantItem;
  unpaidOrders: {
    id: string;
    totalAmount: string;
    createdAt: string;
    status: string;
    isSettled: string;
  }[];
}

export const adminPaymentApi = {
  getSummary(period?: string) {
    const query = period && period !== "all" ? `?period=${period}` : "";
    return get<SettlementSummary>(`/api/admin/payments${query}`);
  },
  getUnpaidOrders(restaurantId: string) {
    return get<UnpaidOrdersDetail>(`/api/admin/payments/${restaurantId}`);
  },
  settle(payload: { restaurantId: string; orderIds: string[]; transactionId?: string; notes?: string }) {
    return post<{ settlement: Record<string, unknown> }>("/api/admin/payments/settle", payload);
  },
};
