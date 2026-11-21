"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { RefundRequest } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function AdminRefundsPage() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () => api<RefundRequest[]>("/admin/refunds").then(setRequests).catch((e) => setError(e.message));
  useEffect(() => { void load(); }, []);

  const decide = async (request: RefundRequest, status: "approved" | "rejected") => {
    const adminNote = window.prompt(status === "approved" ? "Add an optional approval note:" : "Why is this refund being rejected?");
    if (adminNote === null) return;
    setBusy(request.id);
    setError("");
    try {
      await api(`/admin/refunds/${request.id}`, { method: "PATCH", body: JSON.stringify({ status, admin_note: adminNote }) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the refund request.");
    } finally {
      setBusy(null);
    }
  };

  return <div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-heading text-2xl font-bold text-brand-text">Refund requests</h1>
        <p className="mt-1 text-sm text-gray-500">Review customer requests and record your decision.</p></div>
      <Button variant="outline" onClick={load}>Refresh</Button>
    </div>
    {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
      {requests.map((request) => <li key={request.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-brand-text">Order #{request.order_id} · {request.product_name}</h2>
            <Badge tone={request.status === "approved" ? "green" : request.status === "rejected" ? "red" : "gold"}>{request.status}</Badge></div>
          <p className="mt-1 text-sm text-gray-600">{request.quantity} item(s) · {formatPrice(request.amount)} · {formatDate(request.requested_at)}</p>
          <p className="mt-1 break-words text-sm text-gray-700">{request.reason}</p>
          {request.admin_note && <p className="mt-1 text-xs text-gray-500">Admin note: {request.admin_note}</p>}
        </div>
        {request.status === "pending" && <div className="flex gap-2">
          <Button disabled={busy === request.id} onClick={() => decide(request, "approved")}>Approve</Button>
          <Button variant="outline" disabled={busy === request.id} onClick={() => decide(request, "rejected")}>Reject</Button>
        </div>}
      </li>)}
      {requests.length === 0 && <li className="py-12 text-center text-sm text-gray-500">No refund requests yet.</li>}
    </ul>
  </div>;
}
