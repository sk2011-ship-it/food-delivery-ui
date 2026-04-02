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

export type UserRole   = "customer" | "driver" | "owner" | "admin";
export type UserStatus = "active" | "banned";

export interface AdminUserItem {
  id:        string;
  name:      string;
  email:     string;
  phone:     string;
  role:      UserRole;
  status:    UserStatus;
  createdAt: string;
}

export interface AdminUserListResponse {
  users:    AdminUserItem[];
  total:    number;
  page:     number;
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
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
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
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
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
    return post<AuthUser>("/api/auth/register", payload);
  },
  logout() {
    return post<null>("/api/auth/logout", {});
  },
};

/* ── Admin: Restaurant Management API ── */

export type RestaurantStatus = "active" | "inactive" | "suspended";
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type DayHours = { open: string; close: string } | null;
export type OpeningHours = Partial<Record<DayKey, DayHours>>;

export interface AdminRestaurantItem {
  id:            string;
  name:          string;
  location:      string | null;
  logoUrl:       string | null;
  ownerId:       string;
  ownerName:     string | null;
  ownerEmail:    string | null;
  ownerPhone:    string | null;
  managerPhone:  string | null;
  contactEmail:  string;
  contactPhone:  string;
  businessRegNo: string | null;
  openingHours:  OpeningHours | null;
  status:        RestaurantStatus;
  createdAt:     string;
}

export interface AdminRestaurantListResponse {
  restaurants: AdminRestaurantItem[];
  total:       number;
  page:        number;
  pageSize:    number;
}

export interface ListRestaurantsParams {
  search?:   string;
  status?:   string;
  location?: string;
  sort?:     "name" | "createdAt";
  order?:    "asc" | "desc";
  page?:     number;
  limit?:    number;
}

export interface RestaurantPayload {
  name:           string;
  location?:      string;
  logoUrl?:       string;
  ownerId:        string;
  managerPhone?:  string;
  contactEmail:   string;
  contactPhone:   string;
  businessRegNo?: string;
  openingHours?:  OpeningHours;
  status?:        RestaurantStatus;
}

export const restaurantApi = {
  list(params: ListRestaurantsParams = {}) {
    const qs = new URLSearchParams();
    if (params.search)    qs.set("search",   params.search);
    if (params.status)    qs.set("status",   params.status);
    if (params.location)  qs.set("location", params.location);
    if (params.sort)      qs.set("sort",     params.sort);
    if (params.order)     qs.set("order",    params.order);
    if (params.page)      qs.set("page",     String(params.page));
    if (params.limit)     qs.set("limit",    String(params.limit));
    return get<AdminRestaurantListResponse>(`/api/admin/restaurants?${qs.toString()}`);
  },

  create(payload: RestaurantPayload) {
    return post<AdminRestaurantItem>("/api/admin/restaurants", payload);
  },

  update(id: string, payload: Partial<RestaurantPayload>) {
    return put<AdminRestaurantItem>(`/api/admin/restaurants/${id}`, payload);
  },

  delete(id: string) {
    return del<{ id: string }>(`/api/admin/restaurants/${id}`);
  },
};

/* ── Admin: User Management API ── */

export interface ListUsersParams {
  search?:  string;
  role?:    string;
  status?:  string;
  sort?:    "name" | "createdAt";
  order?:   "asc" | "desc";
  page?:    number;
  limit?:   number;
}

export const adminApi = {
  listUsers(params: ListUsersParams = {}) {
    const qs = new URLSearchParams();
    if (params.search)  qs.set("search",  params.search);
    if (params.role)    qs.set("role",    params.role);
    if (params.status)  qs.set("status",  params.status);
    if (params.sort)    qs.set("sort",    params.sort);
    if (params.order)   qs.set("order",   params.order);
    if (params.page)    qs.set("page",    String(params.page));
    if (params.limit)   qs.set("limit",   String(params.limit));
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
  id:                 string;
  restaurantId:       string;
  restaurantName:     string;
  restaurantLocation: string | null;
  name:               string;
  description:        string | null;
  category:           string;
  price:              number;
  status:             MenuItemStatus;
  imageUrl:           string;
  createdAt:          string;
}

export interface AdminMenuListResponse {
  items:    AdminMenuItemResponse[];
  total:    number;
  page:     number;
  pageSize: number;
}

export interface ListMenuParams {
  search?:       string;
  restaurantId?: string;
  status?:       string;
  page?:         number;
  limit?:        number;
}

export interface MenuItemPayload {
  restaurantId: string;
  name:         string;
  description?: string;
  category:     string;
  price:        number;
  status?:      MenuItemStatus;
  imageUrl:     string;
}

export const menuApi = {
  list(params: ListMenuParams = {}) {
    const qs = new URLSearchParams();
    if (params.search)       qs.set("search",       params.search);
    if (params.restaurantId) qs.set("restaurantId", params.restaurantId);
    if (params.status)       qs.set("status",       params.status);
    if (params.page)         qs.set("page",         String(params.page));
    if (params.limit)        qs.set("limit",        String(params.limit));
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
