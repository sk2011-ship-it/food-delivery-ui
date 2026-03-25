"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UtensilsCrossed, Zap, MapPin, Clock } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

export default function Home() {
  const [location, setLocation] = useState("");
  const { user, role } = useAuth();

  const showOrderSection = !user || role === 'customer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="flex flex-col items-center text-center gap-8">
          <div className="flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full">
            <UtensilsCrossed className="w-10 h-10 text-orange-600" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            {showOrderSection ? "Hungry?" : "Welcome back"}
            {showOrderSection && <span className="text-orange-600"> Order Now</span>}
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl">
            {showOrderSection 
              ? "Fresh, delicious food from your favorite restaurants delivered straight to your door."
              : "Access your dashboard and manage your business platform efficiently."}
          </p>

          {showOrderSection && (
            <>
              <div className="w-full max-w-md">
                <Input
                  placeholder="Enter your location (e.g., Newcastle)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="text-center"
                />
              </div>

              <Link href={`/restaurants${location ? `?location=${encodeURIComponent(location)}` : ''}`}>
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 px-10 py-6 text-lg">
                  Order Food
                </Button>
              </Link>
            </>
          )}

          {!showOrderSection && (
             <Link href={role === 'admin' ? '/admin' : '/restaurant'}>
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 px-10 py-6 text-lg">
                  Go to Dashboard
                </Button>
             </Link>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="flex flex-col items-center p-8 bg-white rounded-lg border">
            <Zap className="w-10 h-10 text-orange-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
            <p className="text-gray-600">Hot food delivered in 30 minutes</p>
          </div>

          <div className="flex flex-col items-center p-8 bg-white rounded-lg border">
            <MapPin className="w-10 h-10 text-orange-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Wide Range</h3>
            <p className="text-gray-600">Choose from 100+ restaurants</p>
          </div>

          <div className="flex flex-col items-center p-8 bg-white rounded-lg border">
            <Clock className="w-10 h-10 text-orange-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Always Open</h3>
            <p className="text-gray-600">Order from morning to late night</p>
          </div>
        </div>
      </section>
    </div>
  );
}
