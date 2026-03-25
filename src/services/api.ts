import { User } from "@supabase/supabase-js";

interface AuthSuccessResponse {
  user: User;
  role: string;
}

interface ErrorResponse {
  error: string;
}

interface MessageResponse {
  success: boolean;
  error?: string;
}

interface UserResponse {
  user: User | null;
  role: string | null;
  details: any | null;
}

export const authService = {
  async signUp(
    email: string, 
    password: string, 
    confirmPassword: string,
    role: string, 
    first_name: string,
    last_name: string,
    mobile: string,
    postcode: string
  ): Promise<AuthSuccessResponse> {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        password, 
        confirmPassword, 
        role, 
        first_name, 
        last_name, 
        mobile, 
        postcode 
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error((data as ErrorResponse).error || 'Signup failed');
    return data as AuthSuccessResponse;
  },

  async signIn(email: string, password: string): Promise<AuthSuccessResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error((data as ErrorResponse).error || 'Login failed');
    return data as AuthSuccessResponse;
  },

  async signOut(): Promise<MessageResponse> {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    });
    const data = await response.json();
    if (!response.ok) throw new Error((data as ErrorResponse).error || 'Logout failed');
    return data as MessageResponse;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await fetch('/api/auth/user');
    const data = await response.json();
    if (!response.ok) throw new Error((data as ErrorResponse).error || 'Failed to fetch user');
    return data as UserResponse;
  },

  async updateProfile(details: { first_name: string; last_name: string; mobile: string; postcode: string }) {
    const response = await fetch('/api/auth/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Update failed');
    return data;
  },
};
