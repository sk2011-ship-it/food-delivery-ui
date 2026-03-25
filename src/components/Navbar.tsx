"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, role, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || loading) return null;

  const isLoggedIn = !!user;

  if (!mounted) return null;

  return (
    <nav className="sticky top-0 z-50 border-b bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <UtensilsCrossed className="w-6 h-6 text-orange-600" />
          FoodHub
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition">
            Home
          </Link>
          {(role === 'customer' || !isLoggedIn) && (
            <Link href="/restaurants" className="text-gray-600 hover:text-gray-900 transition">
              Order
            </Link>
          )}
          {role === 'owner' && (
            <Link href="/restaurant" className="text-gray-600 hover:text-gray-900 transition font-medium">
              Restaurant Dashboard
            </Link>
          )}
          {role === 'admin' && (
            <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition font-medium">
              Admin Panel
            </Link>
          )}
          <Link href="/offers" className="text-gray-600 hover:text-gray-900 transition">
            Offers
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition">
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link href="/account">
              <Button variant="outline" className="cursor-pointer">Account</Button>
            </Link>
          ) : (
            <Link href="/account/login">
              <Button className="cursor-pointer">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}