"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, type RegistrationData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { type ChurchBranch } from "@/lib/data/profiles";
import {
  MAGIC_LINK_EXPIRY_MINUTES,
  RESEND_COOLDOWN_SECONDS,
} from "@/lib/constants";
import Link from "next/link";
import { Spinner } from "@heroui/react";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { PhoneInput } from "@/components/forms/PhoneInput";

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
      .then(({ data }: { data: ChurchBranch[] | null }) => {
        if (data) setBranches(data);
      });
  }, []);

  useEffect(() => {
    if (!sent || countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c: number) => c - 1), 1000);
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
      <div className="w-full max-w-sm animate-scale-in text-center">
        <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
          <EnvelopeSimpleIcon size={28} weight="duotone" className="text-accent" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
          Check your inbox
        </h1>
        <p className="font-medium text-foreground text-sm mb-1">{sentEmail}</p>
        <p className="text-xs text-muted mb-8">
          Click the link to complete your registration. Expires in {MAGIC_LINK_EXPIRY_MINUTES} minutes.
        </p>
        {countdown > 0 ? (
          <p className="text-sm text-muted">Resend in {countdown}s</p>
        ) : (
          <button onClick={handleResend} className="text-sm font-medium text-accent hover:underline">
            Resend link
          </button>
        )}
        <button
          onClick={() => setSent(false)}
          className="block mx-auto mt-4 text-sm text-muted hover:text-foreground transition-colors"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="lg:hidden mb-8">
        <Link href="/" className="font-heading font-bold text-xl text-foreground">RoyalHouse</Link>
      </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? "bg-accent" : "bg-border"}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? "bg-accent" : "bg-border"}`} />
          </div>

          <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
            {step === 1 ? "Create your account" : "Almost there"}
          </h1>
          <p className="text-sm text-muted mb-8">
            {step === 1
              ? "Takes under a minute. No password required."
              : "Just a few more details so we can match you with your branch."}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-2">
                    Full name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    autoComplete="name"
                    {...register("full_name")}
                    className="w-full rounded-xl border border-border px-4 py-3.5 text-foreground bg-background focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all duration-200"
                    placeholder="John Doe"
                  />
                  {errors.full_name && <p className="text-sm text-danger mt-1.5">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
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
                  {errors.email && <p className="text-sm text-danger mt-1.5">{errors.email.message}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Phone number
                  </label>
                  <PhoneInput
                    id="phone"
                    value={watch("phone") || ""}
                    onChange={(e164) => setValue("phone", e164, { shouldValidate: true })}
                    error={!!errors.phone}
                  />
                  {errors.phone && <p className="text-sm text-danger mt-1.5">{errors.phone.message}</p>}
                </div>
                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="bg-foreground text-background rounded-full h-12 w-full font-medium hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
                >
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Gender</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue("gender", "male", { shouldValidate: true })}
                      className={`rounded-xl h-12 font-medium transition-all duration-200 ${
                        selectedGender === "male"
                          ? "bg-accent text-accent-foreground ring-2 ring-accent/20"
                          : "border border-border text-foreground hover:border-accent/40"
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("gender", "female", { shouldValidate: true })}
                      className={`rounded-xl h-12 font-medium transition-all duration-200 ${
                        selectedGender === "female"
                          ? "bg-accent text-accent-foreground ring-2 ring-accent/20"
                          : "border border-border text-foreground hover:border-accent/40"
                      }`}
                    >
                      Female
                    </button>
                  </div>
                  {errors.gender && <p className="text-sm text-danger mt-1.5">{errors.gender.message}</p>}
                </div>
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-foreground mb-2">
                    Age
                  </label>
                  <input
                    id="age"
                    type="number"
                    min="1"
                    {...register("age", { valueAsNumber: true })}
                    className="w-full rounded-xl border border-border px-4 py-3.5 text-foreground bg-background focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all duration-200"
                    placeholder="25"
                  />
                  {errors.age && <p className="text-sm text-danger mt-1.5">{errors.age.message}</p>}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Church branch
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
                    onBlur={() => setTimeout(() => setBranchDropdownOpen(false), 150)}
                    className="w-full rounded-xl border border-border px-4 py-3.5 text-foreground bg-background focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all duration-200"
                    placeholder="Search your branch..."
                  />
                  {branchDropdownOpen && filteredBranches.length > 0 && (
                    <ul className="absolute z-10 mt-2 w-full max-h-48 overflow-auto bg-surface border border-border rounded-xl shadow-lg py-1">
                      {filteredBranches.map((branch) => (
                        <li key={branch.id}>
                          <button
                            type="button"
                            onMouseDown={() => {
                              setValue("church_branch_id", branch.id, { shouldValidate: true });
                              setBranchSearch(branch.name);
                              setBranchDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-secondary text-foreground transition-colors"
                          >
                            {branch.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.church_branch_id && <p className="text-sm text-danger mt-1.5">{errors.church_branch_id.message}</p>}
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-border text-foreground rounded-full h-12 font-medium hover:bg-surface-secondary transition-colors duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-foreground text-background rounded-full h-12 font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" color="current" />
                        Creating...
                      </>
                    ) : (
                      "Create account"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
          <p className="text-sm text-muted text-center mt-8">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-foreground font-medium hover:text-accent transition-colors">
              Sign in
            </Link>
          </p>
        </div>
  );
}
