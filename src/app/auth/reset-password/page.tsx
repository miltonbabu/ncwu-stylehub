"use client";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { resetPassword } from "@/lib/api";
import { CheckCircle2, KeyRound, Store } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      window.setTimeout(() => router.push("/auth/sign-in"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password");
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
          <h1 className="mt-5 font-heading text-3xl font-bold text-brand-text">Set a New Password</h1>
          <p className="mt-2 text-sm text-gray-500">Choose a strong password for your account.</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          {!token ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <KeyRound className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-heading text-lg font-bold text-brand-text">This link is incomplete</h2>
              <p className="mt-2 text-sm text-gray-500">
                Reset links must be opened from the email we sent you.
              </p>
              <Link
                href="/auth/forgot-password"
                className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
              >
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-heading text-lg font-bold text-brand-text">Password updated</h2>
              <p className="mt-2 text-sm text-gray-500">
                You can now sign in with your new password. Redirecting…
              </p>
              <Link
                href="/auth/sign-in"
                className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <Field label="New Password" htmlFor="rp-password">
                <Input
                  id="rp-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </Field>
              <Field label="Confirm Password" htmlFor="rp-confirm">
                <Input
                  id="rp-confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                />
              </Field>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" loading={submitting} className="w-full">
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
