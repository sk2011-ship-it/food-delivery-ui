"use client";

import { ShoppingCart, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface DishActionsProps {
  dish: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    restaurantId: string;
    restaurantName: string | null;
    status: string;
  };
  siteTheme: {
    gradientFrom: string;
    accent: string;
  };
}

export default function DishActions({ dish, siteTheme }: DishActionsProps) {
  const { cartItems, addItem, updateQuantity } = useCart();
  const { gradientFrom, accent } = siteTheme;

  const cartItem = cartItems.find(i => i.menuItemId === dish.id);
  const qty = cartItem?.quantity ?? 0;
  const isUnavailable = dish.status === "unavailable";

  if (qty === 0) {
    return (
      <button
        disabled={isUnavailable}
        onClick={() => addItem({
          menuItemId: dish.id,
          name: dish.name,
          price: dish.price,
          imageUrl: dish.imageUrl || "",
          restaurantId: dish.restaurantId,
          restaurantName: dish.restaurantName || "Restaurant"
        })}
        className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold uppercase tracking-wider shadow-md transition-all hover:opacity-90 active:scale-95 disabled:grayscale disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
      >
        <ShoppingCart className="w-4 h-4 shrink-0" />
        <span className="text-xs sm:text-sm">Add to Order — £{dish.price.toFixed(2)}</span>
      </button>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-between gap-4 px-6 py-2 rounded-xl bg-gray-50 border border-gray-100">
      <button
        onClick={() => updateQuantity(dish.id, qty - 1)}
        className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-gray-200 transition-colors hover:bg-gray-100"
      >
        <Minus className="w-4 h-4 text-gray-500" />
      </button>
      
      <div className="flex flex-col items-center">
        <span className="text-lg font-black text-gray-900 leading-none">{qty}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">In Cart</span>
      </div>

      <button
        onClick={() => updateQuantity(dish.id, qty + 1)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 shadow-md"
        style={{ background: accent }}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
