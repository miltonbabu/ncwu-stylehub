"use client";

import { Badge } from "@/components/ui/badge";
import { api, createAdminUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { User } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Loader2, Plus, Search, ShieldCheck, Trash2, UserCog, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" as "customer" | "admin" });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [created, setCreated] = useState<string | null>(null);

  useEffect(() => {
    api<User[]>("/admin/users")
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const updateUser = async (id: number, patch: { role?: string; is_active?: boolean }) => {
    setBusyId(id);
    try {
      const updated = await api<User>(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (id: number) => {
    if (!window.confirm("Permanently delete this user? Their orders, cart and reviews will also be removed. This cannot be undone.")) {
      return;
    }
    setBusyId(id);
    try {
      await api(`/admin/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    setCreating(true);
    try {
      const createdUser = await createAdminUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      setUsers((prev) => [createdUser, ...prev]);
      setCreated(createdUser.email);
      setForm({ name: "", email: "", password: "", role: "customer" });
      setShowCreate(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create user");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">View accounts, change roles and control access.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreated(null);
            setFormError("");
            setShowCreate(true);
          }}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-gradient px-4 py-2.5 text-xs font-semibold text-white shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {created && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>
            Account created for <strong>{created}</strong>. A welcome email has been sent.
          </span>
          <button type="button" onClick={() => setCreated(null)} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          aria-label="Search users"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 bg-white md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Role</th>
              <th className="px-5 py-4">Joined</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-500/5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-5 py-4">
                    <div className="h-10 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-gray-50/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-brand-text">
                          {u.name}
                          {me?.id === u.id && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                        </p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={u.role === "admin" ? "accent" : "primary"}>{u.role}</Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={u.is_active ? "green" : "red"}>{u.is_active ? "Active" : "Disabled"}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busyId === u.id || me?.id === u.id}
                        onClick={() => updateUser(u.id, { role: u.role === "admin" ? "customer" : "admin" })}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {u.role === "admin" ? "Make Customer" : "Make Admin"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === u.id || me?.id === u.id}
                        onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <UserCog className="h-3.5 w-3.5" />
                        {u.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === u.id || me?.id === u.id}
                        onClick={() => deleteUser(u.id)}
                        title="Delete user permanently"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />)
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-500">No users found.</div>
        ) : filtered.map((u) => (
          <article key={u.id} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                {u.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-text">{u.name}{me?.id === u.id ? " (you)" : ""}</p>
                <p className="truncate text-xs text-gray-500">{u.email}</p>
              </div>
              <Badge tone={u.role === "admin" ? "accent" : "primary"}>{u.role}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatDate(u.created_at)}</span>
                <Badge tone={u.is_active ? "green" : "red"}>{u.is_active ? "Active" : "Disabled"}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" disabled={busyId === u.id || me?.id === u.id}
                  onClick={() => updateUser(u.id, { role: u.role === "admin" ? "customer" : "admin" })}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-medium text-gray-600 disabled:opacity-40">
                  <ShieldCheck className="h-3.5 w-3.5" /> {u.role === "admin" ? "Demote" : "Make Admin"}
                </button>
                <button type="button" disabled={busyId === u.id || me?.id === u.id}
                  onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-medium text-gray-600 disabled:opacity-40">
                  <UserCog className="h-3.5 w-3.5" /> {u.is_active ? "Disable" : "Enable"}
                </button>
                <button type="button" disabled={busyId === u.id || me?.id === u.id} onClick={() => deleteUser(u.id)}
                  aria-label={`Delete ${u.name}`} title="Delete user permanently"
                  className="inline-flex cursor-pointer items-center rounded-lg border border-red-200 p-1.5 text-red-600 disabled:opacity-40">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-brand-text">Create User</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  The account is created immediately and a welcome email is sent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                aria-label="Close"
                className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitCreate} className="mt-5 space-y-4">
              <div>
                <label htmlFor="nu-name" className="mb-1 block text-xs font-semibold text-gray-600">
                  Full name
                </label>
                <input
                  id="nu-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Li Wei"
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="nu-email" className="mb-1 block text-xs font-semibold text-gray-600">
                  Email
                </label>
                <input
                  id="nu-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="customer@example.com"
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="nu-password" className="mb-1 block text-xs font-semibold text-gray-600">
                  Password
                </label>
                <input
                  id="nu-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="nu-role" className="mb-1 block text-xs font-semibold text-gray-600">
                  Role
                </label>
                <select
                  id="nu-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as "customer" | "admin" })}
                  className="h-11 w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create user
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
