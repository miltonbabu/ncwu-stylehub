"use client";

import { deleteSubscriber, fetchSubscribers } from "@/lib/api";
import type { Subscriber } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Mail, Search, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    fetchSubscribers()
      .then(setSubscribers)
      .catch(() => setSubscribers([]))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id: number) => {
    if (!window.confirm("Remove this club member? They will no longer receive club emails.")) return;
    setBusyId(id);
    try {
      await deleteSubscriber(id);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = subscribers.filter((s) => s.email.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Club Members</h1>
          <p className="mt-1 text-sm text-gray-500">
            Everyone who joined the NCWU StyleHub Club from the storefront. A welcome email is sent automatically.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-primary">
          <Users className="h-4 w-4" /> {subscribers.length} member{subscribers.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email..."
          aria-label="Search club members"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Source</th>
              <th className="px-5 py-4">Joined</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4" />
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
                <td colSpan={5} className="px-5 py-14 text-center">
                  <Mail className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-3 text-gray-500">
                    {subscribers.length === 0 ? "No club members yet." : "No members match that search."}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((sub) => (
                <tr key={sub.id} className="transition-colors hover:bg-gray-50/60">
                  <td className="px-5 py-3 font-medium text-brand-text">{sub.email}</td>
                  <td className="px-5 py-3 text-gray-600">{sub.source}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(sub.created_at)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        sub.is_active
                          ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                          : "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500"
                      }
                    >
                      {sub.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      disabled={busyId === sub.id}
                      onClick={() => remove(sub.id)}
                      title="Remove member"
                      className="inline-flex cursor-pointer items-center rounded-lg border border-red-200 p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
