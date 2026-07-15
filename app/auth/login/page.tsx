"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import {
  MAGIC_LINK_EXPIRY_MINUTES,
  RESEND_COOLDOWN_SECONDS,
} from "@/lib/constants";
import Link from "next/link";

export default function LoginPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!sent || countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [sent, countdown]);

  const sendMagicLink = useCallback(
    async (data: LoginData) => {
      setSubmitting(true);
      setError("");
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setSubmitting(false);
      if (authError) {
        setError(authError.message ?? "Failed to send magic link. Please try again.");
        return;
      }
      setSentEmail(data.email);
      setSent(true);
      setCountdown(RESEND_COOLDOWN_SECONDS);
    },
    []
  );

  const handleResend = useCallback(async () => {
    const supabase = createClient();
    setCountdown(RESEND_COOLDOWN_SECONDS);
    await supabase.auth.signInWithOtp({ email: sentEmail });
  }, [sentEmail]);

  if (sent) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md bg-surface rounded-xl shadow-sm p-6 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
            Check Your Email
          </h1>
          <p className="text-muted text-sm mb-1">
            We sent a magic link to{" "}
            <span className="font-medium text-foreground">{sentEmail}</span>
          </p>
          <p className="text-muted text-sm mb-6">
            This link expires in {MAGIC_LINK_EXPIRY_MINUTES} minutes.
          </p>
          {countdown > 0 ? (
            <p className="text-sm text-muted">
              Resend available in {countdown}s
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-sm font-medium text-accent hover:underline"
            >
              Resend magic link
            </button>
          )}
          <button
            onClick={() => setSent(false)}
            className="block mx-auto mt-4 text-sm text-muted hover:text-foreground"
          >
            Wrong email? Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-sm p-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground mb-1">
          Welcome Back
        </h1>
        <p className="text-sm text-muted mb-6">
          Enter your email to receive a magic link
        </p>
        <form onSubmit={handleSubmit(sendMagicLink)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="w-full rounded-lg border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-sm text-danger mt-1">{errors.email.message}</p>
            )}
            {error && <p className="text-sm text-danger mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-accent text-accent-foreground rounded-lg h-11 w-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              "Send Magic Link"
            )}
          </button>
        </form>
        <p className="text-sm text-muted text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-accent font-medium hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
