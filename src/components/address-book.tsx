"use client";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { createAddress, deleteAddress, fetchAddresses, updateAddress } from "@/lib/api";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

const EMPTY = { label: "Home", full_name: "", phone: "", address: "", is_default: false };

/** Address book used on the account page; the same records feed the checkout picker. */
export function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, []);

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormOpen(false);
    setError("");
  };

  const startEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone,
      address: address.address,
      is_default: address.is_default,
    });
    setFormOpen(true);
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingId) {
        const updated = await updateAddress(editingId, form);
        setAddresses((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
      } else {
        const created = await createAddress(form);
        setAddresses((prev) => [...prev, created]);
      }
      // Reload so default flags reflect the server's single-default rule.
      fetchAddresses().then(setAddresses).catch(() => undefined);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this address");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (address: Address) => {
    if (!window.confirm(`Delete the "${address.label || "address"}" address?`)) return;
    try {
      await deleteAddress(address.id);
      setAddresses((prev) => prev.filter((a) => a.id !== address.id));
    } catch {
      window.alert("Could not delete this address. Please try again.");
    }
  };

  const makeDefault = async (address: Address) => {
    try {
      await updateAddress(address.id, { ...address, is_default: true });
      fetchAddresses().then(setAddresses).catch(() => undefined);
    } catch {
      window.alert("Could not update the default address.");
    }
  };

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-brand-text">Address Book</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Saved addresses are offered to you automatically at checkout.
          </p>
        </div>
        {!formOpen && (
          <Button
            variant="outline"
            onClick={() => {
              setForm(EMPTY);
              setEditingId(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add address
          </Button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-text">
              {editingId ? "Edit address" : "New address"}
            </p>
            <button
              type="button"
              onClick={reset}
              aria-label="Cancel"
              className="cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Label" htmlFor="ab-label">
              <Input
                id="ab-label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Home, Office…"
              />
            </Field>
            <Field label="Full name" htmlFor="ab-name">
              <Input
                id="ab-name"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </Field>
            <Field label="Phone" htmlFor="ab-phone">
              <Input
                id="ab-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+86 138 0000 0000"
              />
            </Field>
            <div className="sm:col-span-1">
              <Field label="Address" htmlFor="ab-address">
                <Textarea
                  id="ab-address"
                  required
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, city, province, postal code"
                />
              </Field>
            </div>
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            Use as my default delivery address
          </label>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button type="submit" loading={busy}>
              {editingId ? "Save changes" : "Add address"}
            </Button>
            <Button type="button" variant="ghost" onClick={reset}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="mt-4 space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-50" />
          ))}
        </div>
      ) : addresses.length === 0 && !formOpen ? (
        <div className="mt-4 rounded-xl bg-gray-50 px-4 py-8 text-center">
          <p className="text-sm text-gray-500">No saved addresses yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            Add one now and checkout will fill it in for you next time.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className={cn(
                "flex flex-wrap items-start gap-3 rounded-xl border p-4",
                address.is_default ? "border-primary/30 bg-primary/5" : "border-gray-100",
              )}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-brand-text">
                  {address.label || "Address"}
                  {address.is_default && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      Default
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {address.full_name}
                  {address.phone ? ` · ${address.phone}` : ""}
                </p>
                <p className="mt-0.5 break-words text-xs text-gray-500">{address.address}</p>
              </div>
              <div className="flex items-center gap-1">
                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => makeDefault(address)}
                    aria-label={`Make ${address.label || "address"} the default`}
                    className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-white hover:text-amber-500"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(address)}
                  aria-label={`Edit ${address.label || "address"}`}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-white hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(address)}
                  aria-label={`Delete ${address.label || "address"}`}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-white hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
