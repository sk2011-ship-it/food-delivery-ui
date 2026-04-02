"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { useSite } from "@/context/SiteContext";

export default function CustomerCart({ user: _user }: { user: SessionUser }) {
  const { site } = useSite();
  const { gradientFrom, gradientTo, accent } = site.theme;
  // Cart is empty for now — real cart state would come from DB / local state
  const isEmpty = true;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>
          My Cart
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
          Items you&apos;re ready to order
        </p>
      </div>

      {isEmpty ? (
        <div
          className="rounded-3xl p-12 flex flex-col items-center gap-4 text-center"
          style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
        >
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: `${gradientFrom}12` }}
          >
            <ShoppingBag className="w-9 h-9" style={{ color: gradientFrom }} />
          </div>

          <div>
            <p className="text-lg font-bold" style={{ color: "var(--dash-text-primary)" }}>
              Your cart is empty
            </p>
            <p className="text-sm mt-1 max-w-xs mx-auto leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>
              Browse our restaurants and add your favourite dishes to get started
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 mt-1"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
          >
            Browse Restaurants
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        // Placeholder for when cart has items
        <div
          className="rounded-3xl p-5"
          style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
        >
          <p style={{ color: "var(--dash-text-primary)" }}>Cart items go here.</p>
        </div>
      )}

      {/* Suggested / popular picks */}
      <div
        className="rounded-3xl p-5"
        style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
      >
        <h2 className="text-sm font-bold mb-4" style={{ color: "var(--dash-text-primary)" }}>
          Popular right now
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: "Margherita Pizza", place: "Pizza Palace", price: "£12.99", emoji: "🍕" },
            { name: "Smash Burger",     place: "The Anchor",   price: "£10.50", emoji: "🍔" },
            { name: "Chicken Tikka",   place: "Curry House",  price: "£11.00", emoji: "🍛" },
          ].map((item) => (
            <Link
              key={item.name}
              href="/"
              className="flex flex-col gap-2 p-3 rounded-2xl transition-all hover:shadow-md hover:scale-[1.02] active:scale-95"
              style={{ background: "var(--dash-bg)", border: "1px solid var(--dash-card-border)" }}
            >
              <span className="text-3xl">{item.emoji}</span>
              <div>
                <p className="text-xs font-bold leading-tight" style={{ color: "var(--dash-text-primary)" }}>
                  {item.name}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
                  {item.place}
                </p>
              </div>
              <p className="text-xs font-bold" style={{ color: "var(--dash-accent)" }}>
                {item.price}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
