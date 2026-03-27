"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { restaurantService } from "@/services/api";
import { AdminUser } from "@/types/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Store, 
  User as UserIcon,
  Loader2,
  ArrowLeft,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminUsersPage() {
  const { role } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await restaurantService.getUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") fetchData();
  }, [role]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await restaurantService.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (role !== "admin") return <div className="p-8 text-center text-rose-500 font-bold">Unauthorized Access</div>;

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterRole === "all" || u.role === filterRole;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <Users className="w-10 h-10 text-blue-600" /> User Directory
            </h1>
            <p className="text-slate-500 text-lg">Manage role assignments and user permissions.</p>
          </div>
          
          <Button 
            onClick={fetchData} 
            variant="outline" 
            className="rounded-2xl h-14 px-8 font-black border-slate-200"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Refresh Records"}
          </Button>
        </div>


        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Search by name or user ID..." 
                  className="pl-12 h-14 rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-blue-500/20 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-slate-400 hidden sm:block" />
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                  {['all', 'admin', 'owner', 'customer'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setFilterRole(r)}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterRole === r ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Role Status</th>
                    <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Contact</th>
                    <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                          <Users className="w-16 h-16 opacity-20" />
                          <p className="font-black text-xl italic uppercase tracking-widest">No users found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${u.role === 'admin' ? 'bg-rose-100 text-rose-600' : u.role === 'owner' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                              {u.first_name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-lg leading-none">{u.first_name} {u.last_name}</p>
                              <p className="text-slate-400 text-xs mt-1 font-mono uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">ID: {u.id.substring(0, 18)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            {u.role === 'admin' && <ShieldCheck className="w-5 h-5 text-rose-500" />}
                            {u.role === 'owner' && <Store className="w-5 h-5 text-orange-500" />}
                            {u.role === 'customer' && <UserIcon className="w-5 h-5 text-blue-500" />}
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-rose-50 text-rose-600' : u.role === 'owner' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                              {u.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-700 text-sm">{u.mobile || "No Mobile"}</p>
                            <p className="text-xs text-slate-400 font-medium lowercase tracking-tight italic">{u.postcode || "No Postcode"}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <select 
                               onChange={(e) => handleRoleChange(u.id, e.target.value)}
                               className="bg-slate-100 border-none rounded-xl text-xs font-black uppercase tracking-tight py-2 px-3 focus:ring-2 focus:ring-blue-500/20 text-slate-600"
                               value={u.role || ""}
                             >
                               <option value="customer">Make Customer</option>
                               <option value="owner">Promote to Owner</option>
                               <option value="admin">Promote to Admin</option>
                             </select>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
