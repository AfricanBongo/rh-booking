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
import { Spinner } from "@heroui/react";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react";

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
    const timer = setInterval(() => setCountdown((c: number) => c - 1), 1000);
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
      <div className="min-h-screen flex">
        {/* Left: visual panel */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent via-[oklch(0.50_0.18_270)] to-[oklch(0.35_0.15_285)]" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_70%,white_0%,transparent_60%)]" />
          <div className="relative z-10 flex flex-col justify-between p-10 text-white">
            <Link href="/" className="font-heading font-bold text-xl">RoyalHouse</Link>
            <div>
              <p className="font-heading text-4xl font-semibold leading-tight mb-3">
                Where faith<br />meets fellowship.
              </p>
              <p className="text-white/60 text-sm">RoyalHouse Chapel International</p>
            </div>
            <p className="text-white/40 text-xs">Conference Booking Platform</p>
          </div>
        </div>

        {/* Right: email sent state */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm animate-scale-in text-center">
            <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
              <EnvelopeSimpleIcon size={28} weight="duotone" className="text-accent" />
            </div>
            <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
              Check your inbox
            </h1>
            <p className="text-muted text-sm mb-1">
              We sent a sign-in link to
            </p>
            <p className="font-medium text-foreground text-sm mb-6">
              {sentEmail}
            </p>
            <p className="text-xs text-muted mb-8">
              Link expires in {MAGIC_LINK_EXPIRY_MINUTES} minutes. Check spam if you don&apos;t see it.
            </p>
            <div className="space-y-3">
              {countdown > 0 ? (
                <p className="text-sm text-muted">
                  Resend in {countdown}s
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Resend link
                </button>
              )}
              <button
                onClick={() => setSent(false)}
                className="block mx-auto text-sm text-muted hover:text-foreground transition-colors"
              >
                Use a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: visual panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-[oklch(0.50_0.18_270)] to-[oklch(0.35_0.15_285)]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_70%,white_0%,transparent_60%)]" />
        <div className="relative z-10 flex flex-col justify-between p-10 text-white">
          <Link href="/" className="font-heading font-bold text-xl">RoyalHouse</Link>
          <div>
            <p className="font-heading text-4xl font-semibold leading-tight mb-3">
              Where faith<br />meets fellowship.
            </p>
            <p className="text-white/60 text-sm">RoyalHouse Chapel International</p>
          </div>
          <p className="text-white/40 text-xs">Conference Booking Platform</p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="lg:hidden mb-8">
            <Link href="/" className="font-heading font-bold text-xl text-foreground">RoyalHouse</Link>
          </div>
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-muted mb-8">
            Enter your email and we&apos;ll send you a sign-in link. No password needed.
          </p>
          <form onSubmit={handleSubmit(sendMagicLink)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="w-full rounded-xl border border-border px-4 py-3.5 text-foreground bg-background focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all duration-200"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-sm text-danger mt-1.5">{errors.email.message}</p>
              )}
              {error && <p className="text-sm text-danger mt-1.5">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-foreground text-background rounded-full h-12 w-full font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" color="current" />
                  Sending...
                </>
              ) : (
                "Send sign-in link"
              )}
            </button>
          </form>
          <p className="text-sm text-muted text-center mt-8">
            New here?{" "}
            <Link href="/auth/register" className="text-foreground font-medium hover:text-accent transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
