import { create } from 'zustand';
import { persist } from "zustand/middleware";
import { createClient } from '@/lib/supabase/client';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { authApi, AuthUser, UserRole } from '@/lib/api';

interface AuthState {
  session:  Session  | null;
  user:     User     | null;   // Supabase auth user — use for .id
  profile:  AuthUser | null;   // DB profile — use for name, email, role display
  role:     UserRole | null;   // kept for fast role checks across the app
  isReady:  boolean;
  authError: string | null;

  setSession: (session: Session | null) => void;
  setUser:    (user: User | null)       => void;
  setProfile: (profile: AuthUser | null) => void;
  setRole:    (role: UserRole | null)   => void;
  setIsReady: (ready: boolean)          => void;
  setAuthError: (error: string | null)  => void;
  logout:     () => Promise<void>;
  refresh:    () => Promise<void>;
  sync:       (profile: AuthUser) => Promise<void>;
}

const supabase = createClient();
let loadingProfileFor: string | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session:  null,
      user:     null,
      profile:  null,
      role:     null,
      isReady:  false,
      authError: null,

      setSession: (session) => set({ session }),
      setUser:    (user)    => set({ user }),
      setProfile: (profile) => set({ profile }),
      setRole:    (role)    => set({ role }),
      setIsReady: (isReady) => set({ isReady }),
      setAuthError: (authError) => set({ authError }),

      logout: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, profile: null, role: null, isReady: true, authError: null });
      },

      refresh: async () => {
        try {
          set({ authError: null });
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            await loadProfile(session);
          } else {
            set({ session: null, user: null, profile: null, role: null, isReady: true, authError: null });
          }
        } catch (error) {
          console.error("[auth-store] refresh failed:", error);
          set({ isReady: true, authError: "We could not verify your session. Please retry." });
        }
      },

      sync: async (profile: AuthUser) => {
        try {
          // Force a getSession to ensure the client-side session is active
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user.id === profile.id) {
            set({
              session,
              user: session.user,
              profile,
              role: profile.role,
              isReady: true,
              authError: null
            });
          } else {
            // Fallback to refresh if session doesn't match or isn't found
            await get().refresh();
          }
        } catch (error) {
          console.error("[auth-store] sync failed:", error);
          await get().refresh();
        }
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        profile: state.profile,
        role: state.role,
      }),
    }
  )
);

// ── Load profile for a given session ──────────────────────────────────────────
// Fetches the DB profile and sets role + profile atomically,
// then marks the store as ready. Used on INITIAL_SESSION and SIGNED_IN.
async function loadProfile(session: Session) {
  const store = useAuthStore.getState();
  const userId = session.user.id;

  // 1. Prevent concurrent loads for the same user
  if (loadingProfileFor === userId) return;
  
  // 2. Skip if already loaded correctly
  if (store.profile && store.profile.id === userId && store.isReady) {
    store.setSession(session);
    store.setUser(session.user);
    return;
  }

  loadingProfileFor = userId;
  store.setAuthError(null);
  store.setSession(session);
  store.setUser(session.user);

  try {
    const res = await authApi.getMe();
    if (res.success && res.data) {
      store.setProfile(res.data);
      store.setRole(res.data.role);
      store.setAuthError(null);
    } else {
      store.setProfile(null);
      store.setRole(null);
      store.setAuthError("We could not load your account profile. You can retry.");
    }
  } catch (err) {
    console.error("[auth-store] profile fetch failed:", err);
    store.setProfile(null);
    store.setRole(null);
    store.setAuthError("We could not load your account profile. You can retry.");
  } finally {
    loadingProfileFor = null;
    store.setIsReady(true);
  }
}

// ── Global auth state listener ─────────────────────────────────────────────────
// We rely solely on onAuthStateChange — no parallel getSession() call.
// INITIAL_SESSION fires after Supabase has verified + refreshed the token,
// so we never set isReady before we have a trustworthy session.
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    const store = useAuthStore.getState();

    switch (event) {
      case 'INITIAL_SESSION':
      case 'SIGNED_IN':
        if (session) {
          // Load profile then mark ready — async, but isReady stays false until done.
          loadProfile(session);
        } else {
          // No session (e.g. guest on INITIAL_SESSION) — mark ready immediately.
          store.setIsReady(true);
        }
        break;

      case 'TOKEN_REFRESHED':
        // Only the token changed — profile/role haven't changed.
        // Update session silently without touching isReady.
        store.setSession(session);
        store.setUser(session?.user ?? null);
        if (session && !store.profile) {
          loadProfile(session);
        }
        break;

      case 'SIGNED_OUT':
        store.setSession(null);
        store.setUser(null);
        store.setProfile(null);
        store.setRole(null);
        store.setIsReady(true);
        break;

      case 'USER_UPDATED':
        // Re-fetch profile since user data may have changed.
        if (session) loadProfile(session);
        break;
    }
  });
}
