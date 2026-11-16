"use client";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { requestPasswordReset } from "@/lib/api";
import { ArrowLeft, MailCheck, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-14">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <Store className="h-7 w-7" />
          </span>
          <h1 className="mt-5 font-heading text-3xl font-bold text-brand-text">Forgot Password</h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter the email you registered with and we will send a secure reset link.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <MailCheck className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-heading text-lg font-bold text-brand-text">Check your inbox</h2>
              <p className="mt-2 text-sm text-gray-500">
                If <span className="font-semibold text-brand-text">{email}</span> matches an account, a reset link is
                on its way. The link expires in 60 minutes.
              </p>
              <p className="mt-3 text-xs text-gray-400">
                Nothing arrived? Check spam, or try again in a few minutes.
              </p>
              <Link
                href="/auth/sign-in"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <Field label="Email Address" htmlFor="fp-email">
                <Input
                  id="fp-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" loading={submitting} className="w-full">
                Send reset link
              </Button>

              <Link
                href="/auth/sign-in"
                className="flex items-center justify-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
