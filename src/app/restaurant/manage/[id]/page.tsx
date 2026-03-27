"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { restaurantService } from "@/services/api";
import { RestaurantWithMenu, MenuItem, MenuCategory, Restaurant, RestaurantLocation } from "@/types/restaurant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Store,
  Layers,
  UtensilsCrossed,
  MapPin,
  Clock,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Save,
  Info
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import React from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface RestaurantFormState {
  name: string;
  location: RestaurantLocation;
  phone: string;
  email: string;
  opening_time: string;
  closing_time: string;
}

export default function OwnerManageRestaurantPage({ params }: PageProps) {
  const { id } = React.use(params);
  const { user, role } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantWithMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form State
  const [editRes, setEditRes] = useState<RestaurantFormState>({
    name: "",
    location: "Newcastle",
    phone: "",
    email: "",
    opening_time: "09:00",
    closing_time: "22:00"
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await restaurantService.getPublicRestaurantById(id);
      setRestaurant(data);
      setEditRes({
        name: data.name,
        location: data.location,
        phone: data.phone || "",
        email: data.email || "",
        opening_time: data.opening_time || "09:00",
        closing_time: data.closing_time || "22:00"
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch restaurant");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleUpdateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await restaurantService.updateRestaurantByOwner(id, editRes as Partial<Restaurant>);
      toast.success("Restaurant settings updated successfully!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateItem = async (itemId: string, price: number, isAvailable: boolean) => {
    console.log("Updating item:", { itemId, price, isAvailable });
    try {
      const result = await restaurantService.updateMenuItemByOwner(itemId, id, { price, is_available: isAvailable });
      console.log("Update result:", result);
      toast.success("Item updated successfully!");
      fetchData();
    } catch (err: any) {
      console.error("Update error:", err);
      toast.error(err.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
        <p className="text-slate-500 font-bold animate-pulse">Loading Restaurant Data...</p>
      </div>
    </div>
  );

  if (!restaurant) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-8">
      <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
          <Info className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Restaurant Not Found</h2>
          <p className="text-slate-500 mt-2">The system could not retrieve the requested data.</p>
        </div>
        <Link href="/account" className="block">
          <Button className="w-full bg-slate-900 hover:bg-slate-800 rounded-2xl h-14 font-black">
            Return to Account
          </Button>
        </Link>
      </Card>
    </div>
  );

  const isOwner = role === "admin" || (role === "owner" && restaurant.owner_id === user?.id);

  if (!isOwner) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-8">
      <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto text-amber-600">
          <Info className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Access Restricted</h2>
          <p className="text-slate-500 mt-2">You don't have permission to manage this restaurant entity.</p>
        </div>
        <Link href="/account" className="block">
          <Button variant="outline" className="w-full rounded-2xl h-14 font-black">
            Back to Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header Banner */}
      <div className="bg-slate-900 pt-16 pb-32 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl -mr-64 -mt-64"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <Link href="/account" className="inline-flex items-center gap-2 text-orange-400 font-bold hover:text-orange-300 transition-colors bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md">
              <ArrowLeft className="w-4 h-4" /> Back to Profile
            </Link>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center text-slate-900">
                <Store className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{restaurant.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className="bg-orange-500 text-white border-none py-1">Restaurant Owner</Badge>
                  <span className="text-slate-400 flex items-center gap-2"><MapPin className="w-3 h-3" /> {restaurant.location}</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={fetchData}
            className="bg-white/10 border-white/10 text-white hover:bg-white/20 rounded-2xl h-14 px-8 font-black backdrop-blur-md"
          >
            Refresh System
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-16 relative z-20 space-y-8">

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Settings Panel */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-orange-500 to-rose-500"></div>
              <CardHeader className="p-8">
                <CardTitle className="text-2xl font-black">Store Configuration</CardTitle>
                <CardDescription>Manage your public profile and operating hours.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <form onSubmit={handleUpdateRestaurant} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="res-name" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Restaurant Name</Label>
                    <Input
                      id="res-name"
                      value={editRes.name}
                      onChange={(e) => setEditRes({ ...editRes, name: e.target.value })}
                      className="rounded-2xl h-14 border-slate-100 bg-slate-50 focus:bg-white focus:ring-orange-500/20 transition-all font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="res-open" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Opens At</Label>
                      <Input
                        id="res-open"
                        type="time"
                        value={editRes.opening_time}
                        onChange={(e) => setEditRes({ ...editRes, opening_time: e.target.value })}
                        className="rounded-2xl h-14 border-slate-100 bg-slate-50 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="res-close" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Closes At</Label>
                      <Input
                        id="res-close"
                        type="time"
                        value={editRes.closing_time}
                        onChange={(e) => setEditRes({ ...editRes, closing_time: e.target.value })}
                        className="rounded-2xl h-14 border-slate-100 bg-slate-50 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="res-phone" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Contact Phone</Label>
                    <Input
                      id="res-phone"
                      value={editRes.phone}
                      onChange={(e) => setEditRes({ ...editRes, phone: e.target.value })}
                      className="rounded-2xl h-14 border-slate-100 bg-slate-50 font-bold"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full bg-slate-900 hover:bg-slate-800 rounded-[1.5rem] h-16 font-black text-lg shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Store Profile</>}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-orange-600 p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black">Menu Insights</h3>
                <p className="text-orange-100 text-sm leading-relaxed font-medium">
                  You currently have <span className="text-white font-black underline">{restaurant.menu_items.length} dishes</span> across <span className="text-white font-black underline">{restaurant.categories.length} categories</span>. Keep your prices updated to maintain competitiveness.
                </p>
              </div>
            </Card>
          </div>

          {/* Menu Management Panel */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <Layers className="w-8 h-8 text-orange-600" /> Catalog Management
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full border-slate-200 text-slate-400 font-black px-4 py-1">
                  {restaurant.categories.length} GROUPS
                </Badge>
              </div>
            </div>

            <div className="space-y-8">
              {restaurant.categories.length === 0 ? (
                <Card className="rounded-[2.5rem] border-2 border-dashed border-slate-200 p-20 text-center space-y-4 bg-slate-50/50">
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                    <Layers className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-black text-slate-400">No categories mapped.</h4>
                  <p className="text-slate-400 font-medium">Contact administration to define your store hierarchy.</p>
                </Card>
              ) : (
                restaurant.categories.map((cat, idx) => (
                  <div key={cat.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-center gap-4 px-2">
                      <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                      <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{cat.name}</h4>
                    </div>

                    <div className="grid gap-4">
                      {restaurant.menu_items.filter(m => m.category_id === cat.id).length === 0 ? (
                        <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-300 font-black italic uppercase tracking-widest text-sm">
                          Empty Category
                        </div>
                      ) : (
                        restaurant.menu_items.filter(m => m.category_id === cat.id).map(item => (
                          <Card key={item.id} className="rounded-[2rem] border-none shadow-lg bg-white p-6 hover:shadow-xl transition-all group/item">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex items-start gap-5">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover/item:bg-orange-50 group-hover/item:text-orange-600 transition-all">
                                  <UtensilsCrossed className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                  <h5 className="font-black text-xl text-slate-900 group-hover/item:text-orange-600 transition-colors">{item.name}</h5>
                                  <p className="text-slate-400 text-sm font-medium line-clamp-1">{item.description || "No description provided."}</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    {item.is_available ? (
                                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none font-bold">In Stock</Badge>
                                    ) : (
                                      <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-none font-bold">Out of Stock</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-3xl group-hover/item:bg-slate-100 transition-all">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Price</Label>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-400">$</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      defaultValue={item.price}
                                      onBlur={(e) => {
                                        const newPrice = parseFloat(e.target.value);
                                        if (newPrice !== item.price) handleUpdateItem(item.id, newPrice, item.is_available);
                                      }}
                                      className="w-24 h-10 rounded-xl border-none bg-transparent font-black text-slate-900 text-lg p-0 focus-visible:ring-0"
                                    />
                                  </div>
                                </div>

                                <div className="w-px h-10 bg-slate-200"></div>

                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</Label>
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleUpdateItem(item.id, item.price, !item.is_available)}
                                    className={`rounded-xl h-10 px-4 font-black text-xs uppercase tracking-tight transition-all active:scale-95 ${item.is_available ? 'bg-white text-emerald-600 shadow-sm' : 'bg-slate-200 text-slate-500'}`}
                                  >
                                    {item.is_available ? "Disable" : "Enable"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
