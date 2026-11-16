"use client";

import { sendContactMessage } from "@/lib/api";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { FormEvent, useState } from "react";

const FIELD =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setError(null);
    setSending(true);
    try {
      await sendContactMessage({ name, email, subject, message });
      setSent(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h2 className="mt-3 font-heading text-lg font-bold text-emerald-900">Message sent</h2>
        <p className="mt-1 text-sm text-emerald-800">
          Thanks for writing to us — our team has received it and will reply by email soon.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 cursor-pointer rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="font-heading text-lg font-bold text-brand-text">Send us a message</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Your name
          </span>
          <input
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className={FIELD}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Email address
          </span>
          <input
            required
            type="email"
            maxLength={180}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={FIELD}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Subject <span className="font-normal normal-case text-gray-400">(optional)</span>
        </span>
        <input
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Order #1234, sizing question..."
          className={FIELD}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Message
        </span>
        <textarea
          required
          rows={5}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          className={`${FIELD} resize-y`}
        />
      </label>

      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-text disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? "Sending..." : "Send message"}
      </button>
      <p className="text-xs text-gray-400">
        Your message goes straight to our support inbox and shows up in the admin panel.
      </p>
    </form>
  );
}
