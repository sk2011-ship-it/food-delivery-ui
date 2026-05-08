"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, Pencil, Trash2, X, Search, 
  ChefHat, Save, Loader2
} from "lucide-react";
import { ownerMenuApi, type AdminMenuItemResponse, type MenuItemStatus } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isLikelyImageUrl, normalizeImageUrl } from "@/lib/image";

/* ── Predefined categories ── */
const MENU_CATEGORIES = [
  "Starters", "Mains", "Burgers", "Pizza", "Pasta", 
  "Chicken", "Sides", "Desserts", "Cold Drinks", "Hot Drinks"
] as const;

interface MenuEditorProps {
  restaurantId: string;
}

export default function MenuEditor({ restaurantId }: MenuEditorProps) {
  const [items, setItems] = useState<AdminMenuItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminMenuItemResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Form State
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Mains",
    price: "",
    status: "available" as MenuItemStatus,
    imageUrl: ""
  });
  const [saving, setSaving] = useState(false);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    const res = await ownerMenuApi.list();

    if (res.success && res.data) {
      setItems(res.data.items.filter((item) => item.restaurantId === restaurantId));
    } else {
      toast.error("Failed to load menu items");
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial menu load on mount
      void fetchMenu();
    }
  }, [restaurantId, fetchMenu]);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      category: "Mains",
      price: "",
      status: "available",
      imageUrl: ""
    });
    setEditingItem(null);
    setIsAdding(false);
  };

  const handleEdit = (item: AdminMenuItemResponse) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || "",
      category: item.category,
      price: item.price.toString(),
      status: item.status,
      imageUrl: item.imageUrl
    });
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.imageUrl) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!isLikelyImageUrl(form.imageUrl)) {
      toast.error("Please provide a valid image URL");
      return;
    }

    setSaving(true);
    const payload = {
      restaurantId,
      name: form.name,
      description: form.description,
      category: form.category,
      price: parseFloat(form.price),
      status: form.status,
      imageUrl: normalizeImageUrl(form.imageUrl),
    };

    const res = editingItem 
      ? await ownerMenuApi.update(editingItem.id, payload)
      : await ownerMenuApi.create(payload);

    setSaving(false);
    if (res.success) {
      toast.success(editingItem ? "Dish updated" : "Dish added to menu");
      fetchMenu();
      resetForm();
    } else {
      toast.error(res.error || "Failed to save dish");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await ownerMenuApi.delete(id);
    if (res.success) {
      toast.success("Dish removed from menu");
      setItems(prev => prev.filter(item => item.id !== id));
      setDeletingId(null);
    } else {
      toast.error("Failed to delete dish");
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Syncing menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search your menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-10 pr-4 rounded-xl border border-gray-100 bg-white text-xs outline-none focus:border-gray-900 transition-colors shadow-sm"
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
        >
          <Plus className="w-4 h-4" /> Add New Dish
        </button>
      </div>

      {/* ── Menu Grid ── */}
      {filteredItems.length === 0 ? (
        <div className="py-24 text-center border-2 border-dashed border-gray-100 rounded-3xl">
          <ChefHat className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-500">No dishes found in your menu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className={cn(
              "group relative flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-all",
              item.status === "unavailable" && "opacity-75 grayscale-[0.5]"
            )}>
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-heading text-[8px] font-bold uppercase tracking-widest text-gray-400">{item.category}</span>
                  {item.status === "unavailable" && (
                    <span className="text-[8px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Sold Out</span>
                  )}
                </div>
                <h4 className="font-heading text-[13px] font-bold text-gray-900 truncate tracking-tight">{item.name}</h4>
                <p className="font-heading text-[11px] font-bold text-gray-900 mt-0.5">£{item.price.toFixed(2)}</p>
              </div>

              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(item)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setDeletingId(item.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Delete Confirmation Overlay */}
              {deletingId === item.id && (
                <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center p-3">
                   <div className="text-center space-y-2.5">
                      <p className="font-heading text-[11px] font-bold text-gray-900 uppercase tracking-tight">Remove item?</p>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setDeletingId(null)} className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                        <button onClick={() => handleDelete(item.id)} className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm">Delete</button>
                      </div>
                   </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal (Simplified for the Dashboard) ── */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-heading text-xs font-bold text-gray-900 uppercase tracking-tight">{editingItem ? "Edit Dish" : "Add New Dish"}</h3>
              <button onClick={resetForm} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-heading text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Dish Name</label>
                  <input 
                    value={form.name} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Traditional Cod & Chips"
                    className="w-full h-10 px-4 rounded-xl border border-gray-100 bg-gray-50/50 text-[13px] outline-none focus:border-gray-900 transition-colors shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-heading text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Price (£)</label>
                    <input 
                      type="number" step="0.01"
                      value={form.price} 
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="0.00"
                      className="w-full h-10 px-4 rounded-xl border border-gray-100 bg-gray-50/50 text-[13px] outline-none focus:border-gray-900 transition-colors shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-heading text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Category</label>
                    <select 
                      value={form.category} 
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full h-10 px-4 rounded-xl border border-gray-100 bg-gray-50/50 text-[13px] outline-none focus:border-gray-900 transition-colors appearance-none shadow-sm"
                    >
                      {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-heading text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Description</label>
                  <textarea 
                    rows={2}
                    value={form.description} 
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Briefly describe this dish..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-[13px] outline-none focus:border-gray-900 transition-colors resize-none shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-heading text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Image URL</label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input 
                        value={form.imageUrl} 
                        onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                        placeholder="https://..."
                        className="w-full h-10 px-4 rounded-xl border border-gray-100 bg-gray-50/50 text-[13px] outline-none focus:border-gray-900 transition-colors shadow-sm"
                      />
                    </div>
                    {form.imageUrl && (
                      <div className="w-10 h-10 rounded-lg border border-gray-100 overflow-hidden shrink-0 shadow-sm">
                        <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100/50 bg-gray-50/30 cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox"
                      className="rounded border-gray-200 text-gray-900 focus:ring-gray-900" 
                      checked={form.status === "available"}
                      onChange={e => setForm(f => ({ ...f, status: e.target.checked ? "available" : "unavailable" }))}
                    />
                    <span className="text-[11px] font-bold text-gray-700 tracking-tight">Currently Available for Order</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-50 bg-gray-50/20">
               <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 disabled:opacity-50"
               >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {editingItem ? "Update Dish" : "Add to Menu"}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
