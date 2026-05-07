"use client";

import { useState, useEffect } from "react";
import {
  Search, Plus, MoreVertical, Shield, ShieldOff,
  Pencil, Trash2, X, ChevronDown, User, Mail,
  ChevronsUpDown, ChevronUp, ChevronLeft,
  ChevronRight, Lock, AlertTriangle, Eye, EyeOff,
} from "lucide-react";
import { adminApi, type AdminUserItem, type UserRole, type UserStatus } from "@/lib/api";
import { toast } from "sonner";
import { normalizePhone } from "@/lib/phone";
import PhoneInput from "react-phone-number-input";
import PhoneCountrySelect from "@/components/ui/PhoneCountrySelect";
import type { E164Number } from "libphonenumber-js";
import "react-phone-number-input/style.css";

/* ── Types ── */
type SortField = "name" | "createdAt";
type SortOrder = "asc" | "desc";

interface Filters {
  search: string;
  role: string;
  status: string;
  sort: SortField;
  order: SortOrder;
  page: number;
  pageSize: number;
}

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  customer: { label: "Customer", color: "#3b82f6", bg: "#eff6ff" },
  driver: { label: "Driver", color: "#f59e0b", bg: "#fffbeb" },
  owner: { label: "Owner", color: "#8b5cf6", bg: "#f5f3ff" },
  admin: { label: "Admin", color: "#ef4444", bg: "#fef2f2" },
};

const EMPTY_FORM = { name: "", email: "", phone: "", role: "customer" as UserRole, password: "", confirmPassword: "" };

function SortIcon({
  field,
  activeField,
  order,
}: {
  field: SortField;
  activeField: SortField;
  order: SortOrder;
}) {
  if (activeField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
  return order === "asc"
    ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "var(--dash-accent)" }} />
    : <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--dash-accent)" }} />;
}

/* ── Main Component ── */
export default function AdminUsers({ currentUserId }: { currentUserId: string }) {
  const [userData, setUserData] = useState<{ users: AdminUserItem[]; total: number }>({ users: [], total: 0 });
  const [initialLoad, setInitialLoad] = useState(true);  // skeleton on first mount only
  const [fetching, setFetching] = useState(false);  // subtle indicator on subsequent fetches
  const [searchInput, setSearchInput] = useState("");     // controlled input — updates instantly
  const [filters, setFilters] = useState<Filters>({
    search: "", role: "all", status: "all",
    sort: "name", order: "asc", page: 1, pageSize: 10,
  });

  const [menuId, setMenuId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<AdminUserItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [banTarget, setBanTarget] = useState<AdminUserItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserItem | null>(null);
  const [saving, setSaving] = useState(false);

  /* ── Debounce: commit search to filters 1s after user stops typing ── */
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput, page: 1 }));
    }, 1000);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── Fetch: runs whenever committed filters change ── */
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setFetching(true);
      const res = await adminApi.listUsers({
        search:  filters.search  || undefined,
        role:    filters.role    !== "all" ? filters.role    : undefined,
        status:  filters.status  !== "all" ? filters.status  : undefined,
        sort:    filters.sort,
        order:   filters.order,
        page:    filters.page,
        limit:   filters.pageSize,
      });
      if (cancelled) return;          // newer request already in flight — discard
      setFetching(false);
      setInitialLoad(false);
      if (res.success && res.data) {
        setUserData({ users: res.data.users, total: res.data.total });
      } else {
        toast.error(res.error ?? "Failed to load users.");
      }
    };

    run();
    return () => { cancelled = true; }; // cancel stale requests on re-run
  }, [filters]);

  /* ── Filter helpers ── */
  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const toggleSort = (field: SortField) =>
    setFilters((f) => ({
      ...f,
      sort:  field,
      order: f.sort === field && f.order === "asc" ? "desc" : "asc",
      page:  1,
    }));

  /* ── Actions ── */
  const handleBanToggle = async () => {
    if (!banTarget) return;
    setSaving(true);
    const newStatus: UserStatus = banTarget.status === "active" ? "banned" : "active";
    const res = await adminApi.updateUser(banTarget.id, { status: newStatus });
    setSaving(false);
    if (res.success) {
      toast.success(newStatus === "banned" ? "User banned." : "User restored.");
      setBanTarget(null);
      setUserData((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === banTarget.id ? { ...u, status: newStatus } : u
        ),
      }));
    } else {
      toast.error(res.error ?? "Failed to update user.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const res = await adminApi.deleteUser(deleteTarget.id);
    setSaving(false);
    if (res.success) {
      toast.success("User deleted.");
      setDeleteTarget(null);
      setUserData((prev) => ({
        total: prev.total - 1,
        users: prev.users.filter((u) => u.id !== deleteTarget.id),
      }));
    } else {
      toast.error(res.error ?? "Failed to delete user.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    const res = await adminApi.updateUser(editUser.id, {
      name: editUser.name,
      phone: normalizePhone(editUser.phone),
      role: editUser.role,
      status: editUser.status,
    });
    setSaving(false);
    if (res.success && res.data) {
      toast.success("User updated.");
      setEditUser(null);
      setUserData((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === editUser.id ? res.data! : u
        ),
      }));
    } else {
      toast.error(res.error ?? "Failed to update user.");
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return;
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    const res = await adminApi.createUser({
      ...form,
      phone: normalizePhone(form.phone),
    });
    setSaving(false);
    if (res.success && res.data) {
      toast.success("User created.");
      setAddOpen(false);
      setForm(EMPTY_FORM);
      // Prepend to list and bump total — no refetch needed
      setUserData((prev) => ({
        total: prev.total + 1,
        users: [res.data!, ...prev.users],
      }));
    } else {
      toast.error(res.error ?? "Failed to create user.");
    }
  };

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(userData.total / filters.pageSize));

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>
            User Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
            {initialLoad ? "Loading…" : `${userData.total} users on the platform`}
          </p>
        </div>
        <button
          onClick={() => { setAddOpen(true); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
          style={{ background: "var(--dash-accent)" }}
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div
          className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2.5 rounded-xl border"
          style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
          <input
            type="text"
            placeholder="Search name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none min-w-0"
            style={{ color: "var(--dash-text-primary)" }}
          />
          {fetching && !initialLoad && (
            <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin shrink-0" />
          )}
          {searchInput && !fetching && (
            <button onClick={() => setSearchInput("")}>
              <X className="w-3.5 h-3.5" style={{ color: "var(--dash-text-secondary)" }} />
            </button>
          )}
        </div>

        {/* Role filter */}
        <FilterSelect
          value={filters.role}
          onChange={(v) => setFilter("role", v)}
          options={[
            { value: "all", label: "All Roles" },
            { value: "customer", label: "Customer" },
            { value: "driver", label: "Driver" },
            { value: "owner", label: "Owner" },
            { value: "admin", label: "Admin" },
          ]}
        />

        {/* Status filter */}
        <FilterSelect
          value={filters.status}
          onChange={(v) => setFilter("status", v)}
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "banned", label: "Banned" },
          ]}
        />

        {/* Page size */}
        <FilterSelect
          value={String(filters.pageSize)}
          onChange={(v) => setFilters((f) => ({ ...f, pageSize: Number(v), page: 1 }))}
          options={[
            { value: "10", label: "10 / page" },
            { value: "25", label: "25 / page" },
            { value: "50", label: "50 / page" },
          ]}
        />
      </div>

      {/* ── Table ── */}
      <div
        className="rounded-2xl border"
        style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
      >
        {/* Desktop table header */}
        <div
          className="hidden sm:grid sm:grid-cols-[2fr_2fr_1fr_1fr_1fr_44px] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--dash-text-secondary)", borderBottom: "1px solid var(--dash-card-border)" }}
        >
          <button
            onClick={() => toggleSort("name")}
            className="flex items-center gap-1 text-left hover:opacity-80 transition-opacity"
          >
            User <SortIcon field="name" activeField={filters.sort} order={filters.order} />
          </button>
          <span>Contact</span>
          <span>Role</span>
          <span>Status</span>
          <button
            onClick={() => toggleSort("createdAt")}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            Joined <SortIcon field="createdAt" activeField={filters.sort} order={filters.order} />
          </button>
          <span />
        </div>

        {initialLoad ? (
          /* First load only — show skeleton */
          <div className="divide-y" style={{ borderColor: "var(--dash-card-border)" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: "var(--dash-bg)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 rounded" style={{ background: "var(--dash-bg)" }} />
                  <div className="h-3 w-44 rounded" style={{ background: "var(--dash-bg)" }} />
                </div>
                <div className="h-6 w-20 rounded-full hidden sm:block" style={{ background: "var(--dash-bg)" }} />
                <div className="h-6 w-16 rounded-full hidden sm:block" style={{ background: "var(--dash-bg)" }} />
              </div>
            ))}
          </div>
        ) : userData.users.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold" style={{ color: "var(--dash-text-primary)" }}>No users found</p>
            <p className="text-sm mt-1" style={{ color: "var(--dash-text-secondary)" }}>
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div
            className="divide-y transition-opacity duration-150"
            style={{
              borderColor: "var(--dash-card-border)",
              opacity: fetching ? 0.5 : 1,
              pointerEvents: fetching ? "none" : "auto",
            }}
          >
            {userData.users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === currentUserId}
                menuOpen={menuId === u.id}
                onMenuToggle={() => setMenuId(menuId === u.id ? null : u.id)}
                onEdit={() => { setEditUser({ ...u }); setMenuId(null); }}
                onBan={() => { setBanTarget(u); setMenuId(null); }}
                onDelete={() => { setDeleteTarget(u); setMenuId(null); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!initialLoad && userData.total > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>
            Showing {(filters.page - 1) * filters.pageSize + 1}–{Math.min(filters.page * filters.pageSize, userData.total)} of {userData.total}
          </p>
          <div className="flex items-center gap-1">
            <PageBtn
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              disabled={filters.page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </PageBtn>

            {paginationRange(filters.page, totalPages).map((item, i) =>
              item === "…" ? (
                <span key={`ellipsis-${i}`} className="px-2 text-sm" style={{ color: "var(--dash-text-secondary)" }}>…</span>
              ) : (
                <PageBtn
                  key={item}
                  onClick={() => setFilters((f) => ({ ...f, page: Number(item) }))}
                  active={filters.page === item}
                >
                  {item}
                </PageBtn>
              )
            )}

            <PageBtn
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              disabled={filters.page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </PageBtn>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          <UserFormFields
            values={{ name: editUser.name, email: editUser.email, phone: editUser.phone, role: editUser.role }}
            onChange={(k, v) => setEditUser({ ...editUser, [k]: v as string })}
            showEmail={false}
            showPassword={false}
          />
          {/* Status toggle in edit */}
          <div className="mt-4">
            <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>Account Status</label>
            <div className="flex gap-2 mt-1.5">
              {(["active", "banned"] as UserStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setEditUser({ ...editUser, status: s })}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all capitalize"
                  style={
                    editUser.status === s
                      ? { background: s === "active" ? "#22c55e" : "#ef4444", color: "#fff", borderColor: "transparent" }
                      : { borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)", background: "var(--dash-bg)" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <ModalActions
            onCancel={() => setEditUser(null)}
            onConfirm={handleSaveEdit}
            confirmLabel="Save Changes"
            loading={saving}
          />
        </Modal>
      )}

      {/* ── Add User Modal ── */}
      {addOpen && (
        <Modal title="Add New User" onClose={() => setAddOpen(false)}>
          <UserFormFields
            values={form}
            onChange={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
            showEmail
            showPassword
          />
          <ModalActions
            onCancel={() => setAddOpen(false)}
            onConfirm={handleCreate}
            confirmLabel="Create User"
            loading={saving}
            disabled={!form.name || !form.email || !form.password || !form.confirmPassword}
          />
        </Modal>
      )}

      {/* ── Ban/Unban Confirm ── */}
      {banTarget && (
        <Modal
          title={banTarget.status === "active" ? "Ban User" : "Restore User"}
          onClose={() => setBanTarget(null)}
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>
            {banTarget.status === "active"
              ? <>Ban <strong style={{ color: "var(--dash-text-primary)" }}>{banTarget.name}</strong>? They will immediately lose platform access.</>
              : <>Restore access for <strong style={{ color: "var(--dash-text-primary)" }}>{banTarget.name}</strong>?</>
            }
          </p>
          <ModalActions
            onCancel={() => setBanTarget(null)}
            onConfirm={handleBanToggle}
            confirmLabel={banTarget.status === "active" ? "Ban User" : "Restore Access"}
            confirmColor={banTarget.status === "active" ? "#ef4444" : "#22c55e"}
            loading={saving}
          />
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <Modal
          title="Delete User"
          onClose={() => setDeleteTarget(null)}
          icon={<Trash2 className="w-5 h-5 text-red-500" />}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>
            Permanently delete <strong style={{ color: "var(--dash-text-primary)" }}>{deleteTarget.name}</strong>?{" "}
            Their account and all data will be removed. This cannot be undone.
          </p>
          <ModalActions
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            confirmLabel="Delete User"
            confirmColor="#ef4444"
            loading={saving}
          />
        </Modal>
      )}

      {/* Backdrop to close action menus */}
      {menuId && <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />}
    </div>
  );
}

/* ── User Row — desktop table + mobile card ── */
function UserRow({
  user: u, isSelf, menuOpen, onMenuToggle, onEdit, onBan, onDelete,
}: {
  user: AdminUserItem;
  isSelf: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onEdit: () => void;
  onBan: () => void;
  onDelete: () => void;
}) {
  const rm = ROLE_META[u.role] ?? ROLE_META.customer;
  const initials = u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const joined = new Date(u.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

  return (
    <div className="px-5 py-4 hover:bg-black/[0.015] transition-colors relative">
      {/* Desktop layout */}
      <div className="hidden sm:grid sm:grid-cols-[2fr_2fr_1fr_1fr_1fr_44px] gap-4 items-center">
        {/* User */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: "var(--dash-accent)" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--dash-text-primary)" }}>{u.name}</p>
            <p className="text-xs truncate" style={{ color: "var(--dash-text-secondary)" }}>{u.email}</p>
          </div>
        </div>
        {/* Contact */}
        <p className="text-sm truncate" style={{ color: "var(--dash-text-secondary)" }}>{u.phone}</p>
        {/* Role */}
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full w-fit" style={{ color: rm.color, background: rm.bg }}>
          {rm.label}
        </span>
        {/* Status */}
        <span
          className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
          style={u.status === "active" ? { color: "#22c55e", background: "#f0fdf4" } : { color: "#ef4444", background: "#fef2f2" }}
        >
          {u.status === "active" ? "Active" : "Banned"}
        </span>
        {/* Joined */}
        <p className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>{joined}</p>
        {/* Actions */}
        <ActionMenu menuOpen={menuOpen} onToggle={onMenuToggle} onEdit={onEdit} onBan={onBan} onDelete={onDelete} status={u.status} isSelf={isSelf} />
      </div>

      {/* Mobile card layout */}
      <div className="flex sm:hidden items-start gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: "var(--dash-accent)" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--dash-text-primary)" }}>{u.name}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>{u.email}</p>
            </div>
            <ActionMenu menuOpen={menuOpen} onToggle={onMenuToggle} onEdit={onEdit} onBan={onBan} onDelete={onDelete} status={u.status} isSelf={isSelf} />
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: rm.color, background: rm.bg }}>
              {rm.label}
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={u.status === "active" ? { color: "#22c55e", background: "#f0fdf4" } : { color: "#ef4444", background: "#fef2f2" }}
            >
              {u.status === "active" ? "Active" : "Banned"}
            </span>
            <span className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>· {joined}</span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--dash-text-secondary)" }}>{u.phone}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Action menu ── */
function ActionMenu({
  menuOpen, onToggle, onEdit, onBan, onDelete, status, isSelf,
}: {
  menuOpen: boolean; onToggle: () => void; onEdit: () => void;
  onBan: () => void; onDelete: () => void; status: UserStatus; isSelf: boolean;
}) {
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
      >
        <MoreVertical className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />
      </button>
      {menuOpen && (
        <div
          className="absolute right-0 top-8 z-50 w-36 rounded-xl shadow-lg border py-1 overflow-hidden"
          style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
        >
          <button onClick={onEdit} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-black/5 transition-colors" style={{ color: "var(--dash-text-primary)" }}>
            <Pencil className="w-3 h-3 shrink-0" /> Edit
          </button>

          {!isSelf && (
            <>
              <button onClick={onBan} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-black/5 transition-colors" style={{ color: status === "active" ? "#f59e0b" : "#22c55e" }}>
                {status === "active" ? <><ShieldOff className="w-3 h-3 shrink-0" /> Ban</> : <><Shield className="w-3 h-3 shrink-0" /> Restore</>}
              </button>
              <div className="border-t" style={{ borderColor: "var(--dash-card-border)" }} />
              <button onClick={onDelete} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-3 h-3 shrink-0" /> Delete
              </button>
            </>
          )}

          {isSelf && (
            <p className="px-3 py-2 text-[10px]" style={{ color: "var(--dash-text-secondary)" }}>
              Cannot ban or delete own account
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Filter Select ── */
function FilterSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none text-sm font-medium px-3 py-2.5 pr-7 rounded-xl border outline-none cursor-pointer"
        style={{
          background: "var(--dash-card)",
          borderColor: "var(--dash-card-border)",
          color: "var(--dash-text-primary)",
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--dash-text-secondary)" }} />
    </div>
  );
}

/* ── Pagination helpers ── */
function paginationRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

function PageBtn({ children, onClick, disabled, active }: {
  children: React.ReactNode; onClick: () => void;
  disabled?: boolean; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      style={
        active
          ? { background: "var(--dash-accent)", color: "#fff" }
          : { background: "var(--dash-card)", color: "var(--dash-text-secondary)", border: "1px solid var(--dash-card-border)" }
      }
    >
      {children}
    </button>
  );
}

/* ── Modal wrapper ── */
function Modal({ title, onClose, children, icon }: {
  title: string; onClose: () => void; children: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl"
        style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {icon}
            <h2 className="text-base font-bold" style={{ color: "var(--dash-text-primary)" }}>{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors">
            <X className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Modal action buttons ── */
function ModalActions({ onCancel, onConfirm, confirmLabel, confirmColor, loading, disabled }: {
  onCancel: () => void; onConfirm: () => void;
  confirmLabel: string; confirmColor?: string;
  loading?: boolean; disabled?: boolean;
}) {
  return (
    <div className="flex gap-2 mt-6">
      <button
        onClick={onCancel}
        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
        style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)", background: "var(--dash-bg)" }}
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading || disabled}
        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: confirmColor ?? "var(--dash-accent)" }}
      >
        {loading ? "Please wait…" : confirmLabel}
      </button>
    </div>
  );
}


/* ── User form fields ── */
function UserFormFields({
  values, onChange, showEmail, showPassword,
}: {
  values: { name: string; email?: string; phone: string; role: UserRole; password?: string; confirmPassword?: string };
  onChange: (key: string, value: string) => void;
  showEmail: boolean;
  showPassword: boolean;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordsMatch =
    !values.password || !values.confirmPassword ||
    values.password === values.confirmPassword;

  const fieldBorder = { borderColor: "var(--dash-card-border)" };
  const fieldBg = { background: "var(--dash-bg)", color: "var(--dash-text-primary)" };

  return (
    <div className="space-y-3.5">
      {/* Name */}
      <Field label="Full Name" icon={<User className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />} style={{ ...fieldBorder, ...fieldBg }}>
        <input type="text" placeholder="John Smith" value={values.name} onChange={(e) => onChange("name", e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none" style={{ color: "var(--dash-text-primary)" }} />
      </Field>

      {/* Email */}
      {showEmail && (
        <Field label="Email Address" icon={<Mail className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />} style={{ ...fieldBorder, ...fieldBg }}>
          <input type="email" placeholder="john@example.com" value={values.email ?? ""} onChange={(e) => onChange("email", e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none" style={{ color: "var(--dash-text-primary)" }} />
        </Field>
      )}

      {/* Phone — full country list via react-phone-number-input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>
          Phone Number
        </label>
        <div
          className="flex h-11 w-full rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--dash-card-border)", background: "var(--dash-bg)" }}
        >
          <PhoneInput
            international
            countryCallingCodeEditable={false}
            defaultCountry="GB"
            countrySelectComponent={PhoneCountrySelect}
            value={values.phone as E164Number | undefined}
            onChange={(val) => onChange("phone", val ?? "")}
            className="phone-input-wrapper w-full"
            numberInputProps={{
              className: "phone-number-input",
              placeholder: "Enter phone number",
            }}
          />
        </div>
      </div>

      {/* Password + Confirm */}
      {showPassword && (
        <>
          <Field
            label="Temporary Password"
            icon={<Lock className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />}
            style={{ ...fieldBorder, ...fieldBg }}
          >
            <input
              type={showPwd ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={values.password ?? ""}
              onChange={(e) => onChange("password", e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: "var(--dash-text-primary)" }}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="shrink-0 p-0.5"
              style={{ color: "var(--dash-text-secondary)" }}
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </Field>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>
              Confirm Password
            </label>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
              style={{
                borderColor: !passwordsMatch ? "#ef4444" : "var(--dash-card-border)",
                background: "var(--dash-bg)",
              }}
            >
              <Lock className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter password"
                value={values.confirmPassword ?? ""}
                onChange={(e) => onChange("confirmPassword", e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: "var(--dash-text-primary)" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="shrink-0 p-0.5"
                style={{ color: "var(--dash-text-secondary)" }}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {!passwordsMatch && (
              <p className="text-xs text-red-500 pl-1">Passwords do not match.</p>
            )}
          </div>
        </>
      )}

      {/* Role */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>Role</label>
        <div className="relative">
          <select value={values.role} onChange={(e) => onChange("role", e.target.value)}
            className="w-full appearance-none px-3 py-2.5 rounded-xl border text-sm outline-none pr-9"
            style={{ ...fieldBorder, ...fieldBg }}
          >
            <option value="customer">Customer</option>
            <option value="driver">Driver</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--dash-text-secondary)" }} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, style, children }: {
  label: string; icon: React.ReactNode;
  style: React.CSSProperties; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>{label}</label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={style}>
        {icon}
        {children}
      </div>
    </div>
  );
}
