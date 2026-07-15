"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registrationSchema, type RegistrationData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { type ChurchBranch } from "@/lib/data/profiles";
import {
  MAGIC_LINK_EXPIRY_MINUTES,
  RESEND_COOLDOWN_SECONDS,
} from "@/lib/constants";
import Link from "next/link";

const step1Schema = registrationSchema.pick({
  full_name: true,
  email: true,
  phone: true,
});

const step2Schema = registrationSchema.pick({
  gender: true,
  age: true,
  church_branch_id: true,
});

function LeftPanel(): React.ReactElement {
  return (
    <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-accent to-[oklch(0.45_0.195_253.83)] text-white">
      <div>
        <span className="font-heading font-bold text-2xl">RoyalHouse Booking</span>
      </div>
      <div>
        <blockquote className="font-heading text-3xl font-semibold leading-snug mb-4">
          &ldquo;Come together in faith,<br />grow together in community.&rdquo;
        </blockquote>
        <p className="text-white/70 text-sm">RoyalHouse Chapel International</p>
      </div>
      <div className="text-white/50 text-xs">
        Conference Room Booking Platform
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<ChurchBranch[]>([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { gender: undefined, age: undefined },
  });

  const selectedGender = watch("gender");
  const selectedBranchId = watch("church_branch_id");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("church_branches")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setBranches(data);
      });
  }, []);

  useEffect(() => {
    if (!sent || countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [sent, countdown]);

  const handleStep1Next = useCallback(async () => {
    const valid = await trigger(["full_name", "email", "phone"]);
    if (valid) setStep(2);
  }, [trigger]);

  const onSubmit = useCallback(
    async (data: RegistrationData) => {
      setSubmitting(true);
      setError("");
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: data.full_name,
            phone: data.phone,
            gender: data.gender,
            age: data.age,
            church_branch_id: data.church_branch_id,
          },
        },
      });
      setSubmitting(false);
      if (authError) {
        setError(authError.message ?? "Registration failed. Please try again.");
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

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const selectedBranchName =
    branches.find((b) => b.id === selectedBranchId)?.name ?? "";

  if (sent) {
    return (
      <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100dvh - 4rem)" }}>
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center px-6 overflow-y-auto">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="flex-1 flex items-center justify-center px-6 overflow-y-auto">
        <div className="w-full max-w-md bg-surface rounded-xl shadow-sm p-6">
          <p className="text-sm text-muted mb-1">Step {step} of 2</p>
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-1">
            Create Account
          </h1>
          <p className="text-sm text-muted mb-6">
            {step === 1
              ? "Enter your details to get started"
              : "A few more details about you"}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label
                    htmlFor="full_name"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    autoComplete="name"
                    {...register("full_name")}
                    className="w-full rounded-lg border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
                    placeholder="John Doe"
                  />
                  {errors.full_name && (
                    <p className="text-sm text-danger mt-1">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>
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
                    <p className="text-sm text-danger mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    {...register("phone")}
                    className="w-full rounded-lg border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
                    placeholder="+1 555-123-4567"
                  />
                  {errors.phone && (
                    <p className="text-sm text-danger mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="bg-accent text-accent-foreground rounded-lg h-11 w-full font-medium hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Gender
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setValue("gender", "male", { shouldValidate: true })}
                      className={`flex-1 rounded-lg h-11 font-medium transition-colors ${
                        selectedGender === "male"
                          ? "bg-accent text-accent-foreground"
                          : "border border-border text-foreground hover:bg-default"
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("gender", "female", { shouldValidate: true })}
                      className={`flex-1 rounded-lg h-11 font-medium transition-colors ${
                        selectedGender === "female"
                          ? "bg-accent text-accent-foreground"
                          : "border border-border text-foreground hover:bg-default"
                      }`}
                    >
                      Female
                    </button>
                  </div>
                  {errors.gender && (
                    <p className="text-sm text-danger mt-1">
                      {errors.gender.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="age"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Age
                  </label>
                  <input
                    id="age"
                    type="number"
                    min="1"
                    {...register("age", { valueAsNumber: true })}
                    className="w-full rounded-lg border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
                    placeholder="25"
                  />
                  {errors.age && (
                    <p className="text-sm text-danger mt-1">
                      {errors.age.message}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Church Branch
                  </label>
                  <input
                    type="text"
                    value={branchDropdownOpen ? branchSearch : selectedBranchName}
                    onChange={(e) => {
                      setBranchSearch(e.target.value);
                      setBranchDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setBranchDropdownOpen(true);
                      setBranchSearch("");
                    }}
                    onBlur={() =>
                      setTimeout(() => setBranchDropdownOpen(false), 150)
                    }
                    className="w-full rounded-lg border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
                    placeholder="Search church branch..."
                  />
                  {branchDropdownOpen && filteredBranches.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-surface border border-border rounded-lg shadow-md">
                      {filteredBranches.map((branch) => (
                        <li key={branch.id}>
                          <button
                            type="button"
                            onMouseDown={() => {
                              setValue("church_branch_id", branch.id, {
                                shouldValidate: true,
                              });
                              setBranchSearch(branch.name);
                              setBranchDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-default text-foreground"
                          >
                            {branch.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.church_branch_id && (
                    <p className="text-sm text-danger mt-1">
                      {errors.church_branch_id.message}
                    </p>
                  )}
                </div>
                {error && (
                  <p className="text-sm text-danger">{error}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-border text-foreground rounded-lg h-11 font-medium hover:bg-default transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-accent text-accent-foreground rounded-lg h-11 font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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
                        Registering...
                      </>
                    ) : (
                      "Register"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
          <p className="text-sm text-muted text-center mt-6">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-accent font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
