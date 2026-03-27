"use client";

import { useAuth } from "@/components/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag, Utensils, TrendingUp, Clock, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { restaurantService } from "@/services/api";
import { Restaurant, MenuCategory, MenuItem, MenuItemCreate } from "@/types/restaurant";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function RestaurantDashboard() {
  const { user, role, userDetails, loading: authLoading } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Edit State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItemCreate>>({});
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resData, catData, menuData] = await Promise.all([
        restaurantService.getOwnerRestaurants(),
        restaurantService.getOwnerCategories(),
        restaurantService.getOwnerMenuItems(),
      ]);
      setRestaurants(resData);
      setCategories(catData);
      setMenuItems(menuData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      // Don't toast on first load if it's just empty/404
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === "owner" && !authLoading) {
      fetchData();
    }
  }, [role, authLoading, fetchData]);

  if (authLoading || (loading && restaurants.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (role !== "owner") return null;

  const restaurant = restaurants[0]; // Assuming one restaurant for now

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <Card className="max-w-md w-full text-center p-6">
          <CardHeader>
            <CardTitle>No Restaurant Assigned</CardTitle>
            <CardDescription>You don't have any restaurants assigned to your account yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Please contact the administrator to assign your restaurant to your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await restaurantService.createCategoryByOwner(newCategoryName, restaurant.id);
      toast.success("Category created");
      setNewCategoryName("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateMenuItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category_id) {
      toast.error("Please fill in required fields");
      return;
    }
    try {
      await restaurantService.createMenuItemByOwner({
        ...newItem as MenuItemCreate,
        restaurant_id: restaurant.id
      });
      toast.success("Menu item created");
      setNewItem({});
      setIsAddingItem(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateMenuItem = async () => {
    if (!editingItem) return;
    try {
      await restaurantService.updateMenuItemByOwner(editingItem.id, restaurant.id, editingItem);
      toast.success("Menu item updated");
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteMenuItem = (id: string) => {
    toast("Delete Menu Item", {
      description: "Are you sure you want to delete this item?",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await restaurantService.deleteMenuItemByOwner(id, restaurant.id);
            toast.success("Menu item deleted");
            fetchData();
          } catch (err: any) {
            toast.error(err.message);
          }
        }
      },
      cancel: { label: "Cancel", onClick: () => {} }
    });
  };

  const stats = [
    { title: "Daily Orders", value: "0", icon: ShoppingBag, color: "text-orange-600" },
    { title: "Menu Items", value: menuItems.length.toString(), icon: Utensils, color: "text-blue-600" },
    { title: "Categories", value: categories.length.toString(), icon: TrendingUp, color: "text-green-600" },
    { title: "Location", value: restaurant.location, icon: Clock, color: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Owner Dashboard</Badge>
                <p className="text-gray-600 text-sm">Welcome back, {userDetails?.first_name || user?.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500">Restaurant ID</p>
              <p className="text-xs text-gray-400 font-mono mt-1">{restaurant.id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border p-1 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="menu">Manage Menu</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <Card key={stat.title}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Restaurant Details</CardTitle>
                  <CardDescription>Your current public information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-500">Email</Label>
                      <p className="font-medium mt-1">{restaurant.email || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Phone</Label>
                      <p className="font-medium mt-1">{restaurant.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Hours</Label>
                      <p className="font-medium mt-1">
                        {restaurant.opening_time || '9:00 AM'} - {restaurant.closing_time || '10:00 PM'}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab("menu")}>
                    Go to Menu Management
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Menu and shop updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {menuItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-4 py-2 border-b last:border-0 text-sm">
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                          <Utensils className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{item.name}</p>
                          <p className="text-gray-500 font-mono text-xs">${Number(item.price).toFixed(2)}</p>
                        </div>
                        <Badge className="ml-auto" variant="secondary">Active</Badge>
                      </div>
                    ))}
                    {menuItems.length === 0 && <p className="text-center py-8 text-gray-500 text-sm">No menu items yet</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="menu" className="outline-none">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Menu Items</CardTitle>
                  <CardDescription>Add and update your restaurant's dishes</CardDescription>
                </div>
                {!isAddingItem && (
                  <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setIsAddingItem(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isAddingItem && (
                  <div className="bg-gray-50 border rounded-lg p-6 mb-8 space-y-4">
                    <h3 className="font-bold text-gray-900">Add New Menu Item</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input 
                          placeholder="e.g. Classic Burger" 
                          value={newItem.name || ""} 
                          onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price ($) *</Label>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={newItem.price || ""} 
                          onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <select 
                          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={newItem.category_id || ""}
                          onChange={(e) => setNewItem({...newItem, category_id: e.target.value})}
                        >
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input 
                          placeholder="Short description..." 
                          value={newItem.description || ""} 
                          onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateMenuItem} className="bg-orange-600 hover:bg-orange-700">Save Item</Button>
                      <Button variant="outline" onClick={() => setIsAddingItem(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-gray-500 font-medium">
                        <th className="text-left pb-4">Item Name</th>
                        <th className="text-left pb-4">Category</th>
                        <th className="text-left pb-4">Price</th>
                        <th className="text-right pb-4 mr-10 ">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {menuItems.map((item) => (
                        <tr key={item.id} className="group">
                          <td className="py-4 font-medium">
                            {editingItem?.id === item.id ? (
                              <Input 
                                value={editingItem.name} 
                                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                className="h-8 max-w-[200px]"
                              />
                            ) : item.name}
                          </td>
                          <td className="py-4 text-gray-600">
                            {editingItem?.id === item.id ? (
                              <select 
                                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                value={editingItem.category_id}
                                onChange={(e) => setEditingItem({...editingItem, category_id: e.target.value})}
                              >
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            ) : (
                              categories.find(c => c.id === item.category_id)?.name || 'Uncategorized'
                            )}
                          </td>
                          <td className="py-4 text-gray-900 font-mono">
                            {editingItem?.id === item.id ? (
                              <Input 
                                type="number"
                                value={editingItem.price} 
                                onChange={(e) => setEditingItem({...editingItem, price: Number(e.target.value)})}
                                className="h-8 max-w-[80px]"
                              />
                            ) : `$${Number(item.price).toFixed(2)}`}
                          </td>
                          <td className="py-4">
                            <div className="flex justify-end gap-2">
                              {editingItem?.id === item.id ? (
                                <>
                                  <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700" onClick={handleUpdateMenuItem}>
                                    <Save className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 text-gray-500" onClick={() => setEditingItem(null)}>
                                    <X className="w-3 h-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" variant="outline" className="h-8 text-blue-600 border-blue-200" onClick={() => setEditingItem(item)}>
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200" onClick={() => handleDeleteMenuItem(item.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {menuItems.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-gray-500">
                            No menu items found. Add your first dish to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Category</CardTitle>
                  <CardDescription>Group your dishes for better customer experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category Name</Label>
                    <Input 
                      placeholder="e.g. Main Course, Desserts, Drinks" 
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                  </div>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={handleCreateCategory}>
                    Create Category
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Categories</CardTitle>
                  <CardDescription>Managed categories for {restaurant.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((cat) => (
                      <div key={cat.id} className="p-3 bg-gray-50 rounded-lg border text-sm flex items-center justify-between group">
                        <span className="font-medium text-gray-700">{cat.name}</span>
                        <Badge variant="outline" className="text-[10px] opacity-50">
                          {menuItems.filter(i => i.category_id === cat.id).length} items
                        </Badge>
                      </div>
                    ))}
                    {categories.length === 0 && <p className="text-center py-4 text-gray-500 text-xs col-span-2">No categories yet</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
