"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/services/api";
import { User } from "@supabase/supabase-js";
import { Role, UserDetails } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  role: Role;
  userDetails: UserDetails | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  userDetails: null,
  loading: true,
  refreshUser: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const data = await authService.getCurrentUser();
      setUser(data.user);
      setRole(data.role as Role);
      setUserDetails(data.details);
    } catch (err) {
      console.error("Error fetching user session:", err);
      setUser(null);
      setRole(null);
      setUserDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, userDetails, loading, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
