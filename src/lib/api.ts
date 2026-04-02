/**
 * api.ts — typed client-side fetch wrapper for auth API calls.
 * Pages import these functions instead of calling fetch directly.
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
  role: "customer" | "admin" | "driver";
}

async function post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });

  const json = await res.json();

  if (!res.ok) {
    return { success: false, error: json.error ?? "Something went wrong." };
  }

  return { success: true, data: json.data };
}

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
