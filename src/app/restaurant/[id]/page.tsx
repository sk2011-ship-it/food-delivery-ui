"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, Search, ShoppingCart, ArrowLeft, Loader2, ChevronRight } from "lucide-react";
import React from "react";
import { restaurantService } from "@/services/api";
import { RestaurantWithMenu, MenuItem } from "@/types/restaurant";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RestaurantPage({ params }: PageProps) {
  const { id } = React.use(params);
  const [restaurant, setRestaurant] = useState<RestaurantWithMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const data = await restaurantService.getPublicRestaurantById(id);
        setRestaurant(data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load restaurant");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id]);

  const handleAddToCart = (itemId: string) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const { [itemId]: _, ...rest } = cartItems;
      setCartItems(rest);
    } else {
      setCartItems((prev) => ({
        ...prev,
        [itemId]: newQuantity,
      }));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
    </div>
  );

  if (!restaurant) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Card className="max-w-md w-full p-8 text-center rounded-[2.5rem] border-none shadow-2xl">
        <h1 className="text-3xl font-black text-slate-900 mb-4">Restaurant not found</h1>
        <Link href="/restaurants">
          <Button className="bg-orange-600 hover:bg-orange-700 rounded-2xl h-14 px-8 font-black">
            Back to Restaurants
          </Button>
        </Link>
      </Card>
    </div>
  );

  const filteredItemsCount = (restaurant.menu_items || []).filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Premium Hero Section */}
      <div className="bg-slate-900 pt-16 pb-32 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl -mr-64 -mt-64"></div>
        <div className="max-w-7xl mx-auto relative z-10 space-y-8">
           <Link href="/restaurants" className="inline-flex items-center gap-2 text-orange-400 font-bold hover:text-orange-300 transition-colors bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md">
              <ArrowLeft className="w-4 h-4" /> All Restaurants
           </Link>
           
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                 <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">{restaurant.name}</h1>
                 <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-400 font-bold">
                       <MapPin className="w-5 h-5 text-orange-500" /> {restaurant.location}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-bold">
                       <Clock className="w-5 h-5 text-orange-500" /> {restaurant.opening_time || '09:00'} - {restaurant.closing_time || '22:00'}
                    </div>
                 </div>
              </div>
              <div className="flex gap-2">
                 {(restaurant.categories || []).slice(0, 3).map(c => (
                   <Badge key={c.id} className="bg-white/10 text-white border-none px-4 py-2 rounded-xl backdrop-blur-md font-bold uppercase tracking-widest text-[10px]">
                      {c.name}
                   </Badge>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Menu Section */}
          <div className="lg:col-span-3 space-y-8">
            {/* Search Bar */}
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-2">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-300 w-5 h-5" />
                <Input
                  className="w-full border-none h-16 pl-14 text-lg font-bold placeholder:text-slate-300 focus-visible:ring-0 rounded-[2rem]"
                  placeholder="Search in menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Card>

            <div className="space-y-12">
              <Tabs defaultValue={restaurant.categories?.[0]?.name || "all"} className="w-full">
                <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl mb-8 w-full md:w-auto h-auto flex flex-wrap gap-2 overflow-x-auto">
                  {restaurant.categories?.map((category) => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.name} 
                      className="rounded-xl font-bold py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all"
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {restaurant.categories?.map((category) => (
                  <TabsContent key={category.id} value={category.name} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {restaurant.menu_items?.filter(m => m.category_id === category.id)
                        .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(item => (
                        <Card key={item.id} className="rounded-[2rem] border-none shadow-xl bg-white hover:shadow-2xl transition-all group overflow-hidden">
                          <CardContent className="p-0">
                            <div className="p-6 flex flex-col justify-between h-full space-y-4">
                               <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                     <h3 className="font-black text-xl text-slate-900 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                                     {!item.is_available && <Badge variant="secondary" className="bg-slate-100 text-slate-400">Sold Out</Badge>}
                                  </div>
                                  <p className="text-slate-500 text-sm font-medium line-clamp-2">{item.description || "Freshly prepared with premium ingredients."}</p>
                               </div>
                               <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                  <span className="text-2xl font-black text-slate-900">${item.price.toFixed(2)}</span>
                                  <Button 
                                    onClick={() => handleAddToCart(item.id)}
                                    disabled={!item.is_available}
                                    className="bg-orange-600 hover:bg-orange-700 rounded-xl h-12 px-6 font-bold shadow-lg shadow-orange-100 transition-all active:scale-95"
                                  >
                                    Add to Bag
                                  </Button>
                               </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>

          {/* Checkout / Bag Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
               <div className="bg-slate-900 p-8 text-white">
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="text-2xl font-black uppercase tracking-tight">Your Bag</h3>
                     <div className="bg-orange-600 w-8 h-8 rounded-xl flex items-center justify-center font-black">
                        {Object.values(cartItems).reduce((a, b) => a + b, 0)}
                     </div>
                  </div>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Selected Delicacies</p>
               </div>
               
               <CardContent className="p-8 space-y-6">
                  {Object.keys(cartItems).length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                       <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200">
                          <ShoppingCart className="w-8 h-8" />
                       </div>
                       <p className="text-slate-400 font-bold">Your bag is currently empty.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {Object.entries(cartItems).map(([itemId, quantity]) => {
                          const item = restaurant.menu_items?.find(m => m.id === itemId);
                          if (!item) return null;
                          return (
                            <div key={itemId} className="flex items-center justify-between group">
                               <div className="flex-1 min-w-0 pr-4">
                                  <p className="font-black text-slate-900 truncate">{item.name}</p>
                                  <p className="text-slate-400 text-xs font-bold leading-none mt-1">${item.price.toFixed(2)}</p>
                               </div>
                               <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl">
                                  <button onClick={() => handleUpdateQuantity(itemId, quantity - 1)} className="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-black text-slate-400 hover:text-orange-600 shadow-sm">-</button>
                                  <span className="font-black text-slate-900 text-sm min-w-[20px] text-center">{quantity}</span>
                                  <button onClick={() => handleUpdateQuantity(itemId, quantity + 1)} className="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-black text-slate-400 hover:text-orange-600 shadow-sm">+</button>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="border-t border-slate-100 pt-6 space-y-4">
                         <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Total Amount</span>
                            <span className="text-3xl font-black text-slate-900">
                               ${Object.entries(cartItems).reduce((sum, [id, qty]) => {
                                 const item = restaurant.menu_items?.find(m => m.id === id);
                                 return sum + (item?.price || 0) * qty;
                               }, 0).toFixed(2)}
                            </span>
                         </div>
                         <Button className="w-full bg-orange-600 hover:bg-orange-700 h-16 rounded-[1.5rem] font-black text-lg shadow-xl shadow-orange-100 transition-all active:scale-95 group">
                            Secure Checkout <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                         </Button>
                      </div>
                    </>
                  )}
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
