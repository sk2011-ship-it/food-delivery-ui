"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { type OpeningHours } from "@/types/api.types";
import { isRestaurantOpen } from "@/lib/utils/restaurantUtils";
import { useSite } from "@/context/SiteContext";

export interface CartItem {
  id: string;
  menuItemId: string;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string;
  restaurantName: string;
  restaurantId: string;
  restaurantLocation?: string;
  restaurantLat?: string;
  restaurantLng?: string;
  isMobileChef?: boolean;
  openingHours?: OpeningHours;
}


interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  isGuest: boolean;
  totalItems: number;
  totalPrice: number;
  currentCartItems: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "quantity">) => Promise<void>;
  removeItem: (menuItemId: string) => Promise<void>;
  updateQuantity: (menuItemId: string, quantity: number) => Promise<void>;
  clearCart: (silent?: boolean) => Promise<void>;
  replaceCart: (items: { menuItemId: string; quantity: number }[]) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = "guest_cart";

function normalizeLocation(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

// ── localStorage helpers ─────────────────────────────────────
function loadGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {}
}

import { useAuthStore } from "@/store/useAuthStore";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { session, isReady } = useAuthStore();
  const { site } = useSite();
  const initCalledFor = useRef<string | null>(null);
  const isGuest = !session;

  // ── Fetch DB cart (logged-in users) ─────────────────────────
  // Get a fresh token from Supabase — forces a refresh if the current one is expired.
  const getFreshToken = async (): Promise<string | null> => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      // Sync the refreshed session back into the store
      useAuthStore.getState().setSession(session);
      return session.access_token;
    }
    return null;
  };

  const fetchDBCart = useCallback(async (tokenOverride?: string, retryCount = 0) => {
    const sessionToUse = tokenOverride
      ? { access_token: tokenOverride }
      : useAuthStore.getState().session;

    if (!sessionToUse?.access_token) {
      setCartItems(loadGuestCart());
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        cache: "no-store",
        headers: {
          "Authorization": `Bearer ${sessionToUse.access_token}`
        }
      });

      if (res.status === 401) {
        if (retryCount < 1) {
          const freshToken = await getFreshToken();
          if (freshToken) return fetchDBCart(freshToken, retryCount + 1);
        }
        setCartItems(loadGuestCart());
        return;
      }

      const data = await res.json();
      const fetchedItems = data.data?.items || (Array.isArray(data.data) ? data.data : null);

      if (Array.isArray(fetchedItems)) {
        setCartItems(fetchedItems);
      }
    } catch (err) {
      console.error("[CartContext] Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Sync guest cart → DB on first login ─────────────────────
  const syncGuestCartToDB = useCallback(async (tokenOverride?: string) => {
    const sessionToUse = tokenOverride 
      ? { access_token: tokenOverride } 
      : useAuthStore.getState().session;

    if (!sessionToUse?.access_token) return;

    const guestItems = loadGuestCart();
    if (guestItems.length === 0) return;

    try {
      const res = await fetch("/api/cart/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToUse.access_token}`,
        },
        body: JSON.stringify({ items: guestItems.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })) }),
      });

      if (res.ok) {
        localStorage.removeItem(GUEST_CART_KEY);
        toast.success(`${guestItems.length} item(s) from your guest cart have been saved!`);
      }
    } catch (err) {
      console.error("[CartContext] Failed to sync guest cart:", err);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const initCart = async () => {
      const sessionKey = session?.access_token ?? "guest";
      if (initCalledFor.current === sessionKey) return;
      initCalledFor.current = sessionKey;

      setLoading(true);
      if (session) {
        await syncGuestCartToDB(session.access_token);
        await fetchDBCart(session.access_token);
      } else {
        setCartItems(loadGuestCart());
        setLoading(false);
      }
    };

    initCart();
  }, [session, isReady, fetchDBCart, syncGuestCartToDB]);

  // ── Add item ─────────────────────────────────────────────────
  const addItem = async (item: Omit<CartItem, "id" | "quantity">) => {
    // Validate Restaurant Operational Hours before adding
    if (!isRestaurantOpen(item.openingHours)) {
      toast.error(`${item.restaurantName} is currently closed.`);
      return;
    }

    // If we are currently a guest, use localStorage
    if (isGuest) {
      // Guest: pure localStorage
      const current = loadGuestCart();
      const existingIdx = current.findIndex(i => i.menuItemId === item.menuItemId);
      if (existingIdx > -1) {
        current[existingIdx].quantity += 1;
      } else {
        current.push({ id: `guest-${Date.now()}`, ...item, quantity: 1 });
      }
      saveGuestCart(current);
      setCartItems([...current]);
      toast.success(`'${item.name}' added to cart`);
      return;
    }

    // Logged-in: optimistic + DB
    const existingIndex = cartItems.findIndex(i => i.menuItemId === item.menuItemId);
    const newItems = [...cartItems];
    if (existingIndex > -1) {
      newItems[existingIndex] = { ...newItems[existingIndex], quantity: newItems[existingIndex].quantity + 1 };
    } else {
      newItems.push({ id: "temp-" + Date.now(), ...item, quantity: 1 });
    }
    setCartItems(newItems);

    try {
      const currentSession = useAuthStore.getState().session;
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": currentSession ? `Bearer ${currentSession.access_token}` : ""
        },
        body: JSON.stringify({ menuItemId: item.menuItemId, quantity: 1 }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add item");
      }
      
      // Successfully updated on server, no need for fetchDBCart()
      toast.success(`'${item.name}' added to cart`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add item. Please try again.";
      toast.error(message);
      await fetchDBCart(); // rollback to server state
    }
  };


  // ── Update quantity ──────────────────────────────────────────
  const updateQuantity = async (menuItemId: string, quantity: number) => {
    if (quantity < 0) return;

    // If guest mode
    if (isGuest) {
      const current = loadGuestCart();
      const itemToRemove = current.find(i => i.menuItemId === menuItemId);
      const updated = current
        .map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i)
        .filter(i => i.quantity > 0);
      saveGuestCart(updated);
      setCartItems(updated);
      if (quantity === 0) toast.info(`'${itemToRemove?.name || "Item"}' removed from cart`);
      return;
    }

    // Logged-in: optimistic + DB
    const itemToRemove = cartItems.find(i => i.menuItemId === menuItemId);
    const newItems = cartItems
      .map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i)
      .filter(i => i.quantity > 0);
    setCartItems(newItems);

    try {
      const currentSession = useAuthStore.getState().session;
      const res = await fetch(`/api/cart/${menuItemId}`, {
        method: "PATCH",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": currentSession ? `Bearer ${currentSession.access_token}` : ""
        },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error();
      
      // Successfully updated on server, no need for fetchDBCart()
      if (quantity === 0) toast.info(`'${itemToRemove?.name || "Item"}' removed from cart`);
    } catch {
      toast.error("Failed to update quantity");
      await fetchDBCart(); // rollback to server state
    }
  };

  // ── Remove item ──────────────────────────────────────────────
  const removeItem = async (menuItemId: string) => {
    await updateQuantity(menuItemId, 0);
  };

  // ── Clear cart ───────────────────────────────────────────────
  const clearCart = useCallback(async (silent?: boolean) => {
    const activeLocation = normalizeLocation(site.location);
    const scopedItems = cartItems.filter(
      item => normalizeLocation(item.restaurantLocation) === activeLocation
    );

    if (isGuest) {
      const remainingItems = cartItems.filter(
        item => normalizeLocation(item.restaurantLocation) !== activeLocation
      );
      saveGuestCart(remainingItems);
      setCartItems(remainingItems);
      if (!silent) toast.success("Cart cleared");
      return;
    }

    const backup = [...cartItems];
    const remainingItems = cartItems.filter(
      item => normalizeLocation(item.restaurantLocation) !== activeLocation
    );
    setCartItems(remainingItems);
    try {
      const currentSession = useAuthStore.getState().session;
      await Promise.all(
        scopedItems.map(item =>
          fetch(`/api/cart/${item.menuItemId}`, {
            method: "DELETE",
            headers: {
              Authorization: currentSession ? `Bearer ${currentSession.access_token}` : ""
            }
          }).then((res) => {
            if (!res.ok) throw new Error();
          })
        )
      );
      if (!silent) toast.success("Cart cleared");
    } catch {
      if (!silent) toast.error("Failed to clear cart");
      setCartItems(backup);
    }
  }, [isGuest, cartItems, site.location]);

  const replaceCart = useCallback(async (items: { menuItemId: string; quantity: number }[]) => {
    if (items.length === 0) {
      toast.error("This order has no items to reorder.");
      return false;
    }

    if (isGuest) {
      toast.error("Please sign in to reorder.");
      return false;
    }

    let accessToken: string | undefined | null = useAuthStore.getState().session?.access_token;
    if (!accessToken) {
      accessToken = await getFreshToken();
    }

    if (!accessToken) {
      toast.error("Your session expired. Please sign in again.");
      return false;
    }

    const backup = [...cartItems];
    setLoading(true);

    try {
      const clearRes = await fetch("/api/cart/clear", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!clearRes.ok) {
        throw new Error("CLEAR_FAILED");
      }

      for (const item of items) {
        const addRes = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(item),
        });

        if (!addRes.ok) {
          const data = await addRes.json().catch(() => null);
          throw new Error(data?.error || data?.message || "ADD_FAILED");
        }
      }

      await fetchDBCart(accessToken);
      return true;
    } catch (error) {
      console.error("[CartContext] Failed to replace cart:", error);
      setCartItems(backup);
      toast.error("Failed to prepare your reorder. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [cartItems, fetchDBCart, isGuest]);

  // Removed: automatic cart clearing on site change to persist cart as per user request.
  // useEffect(() => {
  //   if (prevSiteRef.current !== site.key) {
  //     prevSiteRef.current = site.key;
  //     clearCart(true);
  //   }
  // }, [site.key, clearCart]);


  const currentCartItems = useMemo(() => {
    const activeLocation = normalizeLocation(site.location);
    return cartItems.filter(
      item => normalizeLocation(item.restaurantLocation) === activeLocation
    );
  }, [cartItems, site.location]);

  const totalItems = useMemo(() => currentCartItems.reduce((acc, item) => acc + item.quantity, 0), [currentCartItems]);
  const totalPrice = useMemo(() => currentCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [currentCartItems]);

  const value = useMemo(() => ({
    cartItems,
    currentCartItems,
    loading,
    isGuest,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    replaceCart,
  }), [cartItems, currentCartItems, loading, isGuest, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart, replaceCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
