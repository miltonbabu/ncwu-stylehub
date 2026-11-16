"use client";

import {
  deleteContactMessage,
  fetchContactMessages,
  markContactMessageRead,
} from "@/lib/api";
import type { ContactMessage } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Mail, MailOpen, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchContactMessages()
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q),
    );
  }, [messages, query]);

  const unread = messages.filter((m) => !m.is_read).length;
  const allSelected = filtered.length > 0 && filtered.every((m) => selected.includes(m.id));

  const toggleOne = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAll = () =>
    setSelected(allSelected ? [] : filtered.map((m) => m.id));

  const open = async (msg: ContactMessage) => {
    setOpenId((prev) => (prev === msg.id ? null : msg.id));
    if (!msg.is_read) {
      try {
        await markContactMessageRead(msg.id);
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
      } catch {
        /* keep unread flag — the email copy already reached the admin inbox */
      }
    }
  };

  const removeIds = async (ids: number[]) => {
    if (ids.length === 0) return;
    const label = ids.length === 1 ? "this message" : `${ids.length} messages`;
    if (!window.confirm(`Permanently delete ${label}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await Promise.all(ids.map((id) => deleteContactMessage(id)));
      setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
      setSelected((prev) => prev.filter((id) => !ids.includes(id)));
      if (openId !== null && ids.includes(openId)) setOpenId(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Contact Messages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Messages sent from the storefront contact form. Each one is also emailed to the admin inbox.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-primary">
            <Mail className="h-4 w-4" /> {messages.length} total
            {unread > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white">{unread} new</span>}
          </span>
          <button
            type="button"
            disabled={busy || selected.length === 0}
            onClick={() => removeIds(selected)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" /> Delete selected{selected.length > 0 ? ` (${selected.length})` : ""}
          </button>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or message..."
          aria-label="Search contact messages"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Mail className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-gray-500">
              {messages.length === 0 ? "No messages yet." : "No messages match that search."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all messages"
                className="h-4 w-4 cursor-pointer accent-primary"
              />
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Select all on this page
              </span>
            </div>
            <ul className="divide-y divide-gray-500/5">
              {filtered.map((msg) => {
                const isOpen = openId === msg.id;
                return (
                  <li key={msg.id} className={msg.is_read ? "" : "bg-primary/[0.035]"}>
                    <div className="flex items-start gap-3 px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.includes(msg.id)}
                        onChange={() => toggleOne(msg.id)}
                        aria-label={`Select message from ${msg.name}`}
                        className="mt-1 h-4 w-4 cursor-pointer accent-primary"
                      />
                      <button
                        type="button"
                        onClick={() => open(msg)}
                        className="min-w-0 flex-1 cursor-pointer text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {msg.is_read ? (
                            <MailOpen className="h-4 w-4 shrink-0 text-gray-400" />
                          ) : (
                            <Mail className="h-4 w-4 shrink-0 text-primary" />
                          )}
                          <span className="font-semibold text-brand-text">{msg.name}</span>
                          <span className="truncate text-xs text-gray-500">{msg.email}</span>
                          {!msg.is_read && (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                              New
                            </span>
                          )}
                          <span className="ml-auto shrink-0 text-xs text-gray-400">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-gray-600">
                          {msg.subject ? <span className="font-medium text-gray-700">{msg.subject} — </span> : null}
                          {msg.message}
                        </p>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => removeIds([msg.id])}
                        title="Delete permanently"
                        className="inline-flex shrink-0 cursor-pointer items-center rounded-lg border border-red-200 p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 pl-12">
                        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{msg.message}</p>
                        <a
                          href={`mailto:${msg.email}?subject=${encodeURIComponent(
                            msg.subject ? `Re: ${msg.subject}` : "Re: your message to NCWU StyleHub",
                          )}`}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                        >
                          <Mail className="h-4 w-4" /> Reply to {msg.name}
                        </a>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
