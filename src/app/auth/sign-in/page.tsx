"use client";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useAuth } from "@/lib/auth-context";
import { Store } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignInContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const user = await login(email, password);
      try {
        localStorage.setItem("stylehub_welcome", JSON.stringify({ name: user.name, mode: "login" }));
      } catch {
        /* storage unavailable — skip the welcome flash */
      }
      router.push((user.role === "admin" || user.role === "demo_admin") && next === "/" ? "/admin" : next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-3 py-8 sm:min-h-[75vh] sm:px-4 sm:py-14">
      <div className="w-full max-w-md">
        <div className="mb-5 text-center sm:mb-8">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white sm:h-14 sm:w-14">
            <Store className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>
          <h1 className="mt-3 font-heading text-2xl font-bold text-brand-text sm:mt-5 sm:text-3xl">Welcome Back</h1>
          <p className="mt-1 text-xs text-gray-500 sm:mt-2 sm:text-sm">Sign in to your NCWU StyleHub account</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:space-y-5 sm:p-8">
          <Field label="Email Address" htmlFor="si-email">
            <Input
              id="si-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password" htmlFor="si-password">
            <Input
              id="si-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <div className="-mt-2 text-right">
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={submitting} className="w-full">
            Sign In
          </Button>

          <p className="text-center text-sm text-gray-500">
            New to NCWU StyleHub?{" "}
            <Link href={`/auth/sign-up?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </form>

        <div className="mt-4 rounded-2xl border border-primary/10 bg-brand-soft/80 p-3 sm:mt-6 sm:p-4">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-brand-text/60">Quick demo access</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setEmail("user@shop.ncwu.site");
                setPassword("demo@123");
                setError("");
              }}
              className="cursor-pointer rounded-xl border border-white/70 bg-white px-3 py-2.5 text-left text-xs font-semibold text-brand-text shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              <span className="block text-sm">Demo customer</span>
              <span className="mt-0.5 block text-[11px] font-normal text-gray-500">Browse and shop</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("admin@shop.ncwu.site");
                setPassword("t00");
                setError("");
              }}
              className="cursor-pointer rounded-xl border border-white/70 bg-white px-3 py-2.5 text-left text-xs font-semibold text-brand-text shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              <span className="block text-sm">Admin</span>
              <span className="mt-0.5 block text-[11px] font-normal text-gray-500">Manage the store, one admin at a time</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
