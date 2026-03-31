"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { restaurantService } from "@/services/api";
import { MenuItem, Restaurant } from "@/types/restaurant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Utensils } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function OwnerMenuPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      if (role !== "owner") return;
      try {
        setLoading(true);
        const [restaurants, menuItems] = await Promise.all([
          restaurantService.getOwnerRestaurants(),
          restaurantService.getOwnerMenuItems()
        ]);

        if (restaurants.length > 0) {
          setRestaurant(restaurants[0]);
          setItems(menuItems);
        }
      } catch (err: any) {
        toast.error("Failed to load menu data");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchMenu();
    }
  }, [role, authLoading]);

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    if (!restaurant) return;

    // Optimistic UI update
    const previousItems = [...items];
    const newStatus = !currentStatus;

    setItems(items.map(item =>
      item.id === itemId ? { ...item, is_available: newStatus } : item
    ));

    try {
      await restaurantService.toggleMenuItemAvailability(itemId, restaurant.id, newStatus);
      toast.success(`Item marked as ${newStatus ? 'available' : 'sold out'}`);
    } catch (err: any) {
      // Rollback on error
      setItems(previousItems);
      toast.error("Failed to update availability");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
      </div>
    );
  }

  if (role !== "owner") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full p-8 text-center rounded-[2.5rem] border-none shadow-2xl">
          <h1 className="text-2xl font-black text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-500 mb-6 font-medium">Only restaurant owners can access this page.</p>
          <Link href="/">
            <Button className="bg-orange-600 hover:bg-orange-700 rounded-2xl h-14 px-8 font-black">
              Return Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 pt-16 pb-32 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl -mr-64 -mt-64"></div>
        <div className="max-w-5xl mx-auto relative z-10 space-y-6">
          <Link href="/restaurant" className="inline-flex items-center gap-2 text-orange-400 font-bold hover:text-orange-300 transition-colors bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Menu Availability</h1>
              <p className="text-slate-400 font-bold text-lg">{restaurant?.name || 'Loading...'}</p>
            </div>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 px-4 py-2 rounded-xl backdrop-blur-md font-bold">
              {items.length} Total Items
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 -mt-16 relative z-20">
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-2xl font-black text-slate-900">Manage Menu</CardTitle>
            <CardDescription className="text-slate-500 font-bold">Toggle items as Available or Sold Out for your customers</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="p-8 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                        <Utensils className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-slate-900">{item.name}</h3>
                        <div className="flex items-center gap-3">
                          <span className="text-orange-600 font-black text-sm">${item.price.toFixed(2)}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <Badge
                            variant="secondary"
                            className={`rounded-lg font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 ${item.is_available
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                              }`}
                          >
                            {item.is_available ? "Available" : "Sold Out"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          {item.is_available ? "In Stock" : "Out of Stock"}
                        </p>
                      </div>
                      <Switch
                        checked={item.is_available}
                        onCheckedChange={() => handleToggleAvailability(item.id, item.is_available)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
                    <Utensils className="w-10 h-10" />
                  </div>
                  <p className="text-slate-400 font-bold text-lg">No menu items found.</p>
                  <Link href="/restaurant">
                    <Button variant="outline" className="rounded-xl font-bold">Add your first item</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
