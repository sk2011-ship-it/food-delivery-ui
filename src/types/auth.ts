import { User } from "@supabase/supabase-js";

export type Role = "customer" | "owner" | "admin" | null;

export interface UserDetails {
  id: string;
  first_name: string;
  last_name: string;
  mobile: string;
  postcode: string;
}

export interface UserResponse {
  user: User | null;
  role: Role;
  details: UserDetails | null;
}

export interface AuthSuccessResponse {
  user: User;
  role: NonNullable<Role>;
}

export interface MessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ErrorResponse {
  error: string;
}
