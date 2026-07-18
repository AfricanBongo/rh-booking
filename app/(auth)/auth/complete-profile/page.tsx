"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { createClient } from "@/lib/supabase/client";
import { type ChurchBranch } from "@/lib/data/profiles";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { WarningCircleIcon } from "@phosphor-icons/react";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine((val) => isValidPhoneNumber(val), "Invalid phone number"),
  gender: z.enum(["male", "female"], { error: "Please select your gender" }),
  age: z.number().int().positive("Age must be a positive number"),
  church_branch_id: z.string().uuid("Please select your church branch"),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function CompleteProfilePage(): React.ReactElement {
  return (
    <Suspense fallback={<div className="w-full max-w-sm flex justify-center py-12"><Spinner size="lg" /></div>}>
      <CompleteProfileForm />
    </Suspense>
  );
}

function CompleteProfileForm(): React.ReactElement {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") ?? "/dashboard";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<ChurchBranch[]>([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
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

  const onSubmit = useCallback(
    async (data: ProfileData) => {
      setSubmitting(true);
      setError("");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Session expired. Please sign in again.");
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        full_name: data.full_name,
        phone: data.phone,
        gender: data.gender,
        age: data.age,
        church_branch_id: data.church_branch_id,
      });

      setSubmitting(false);

      if (insertError) {
        if (insertError.code === "23505") {
          window.location.href = returnUrl;
          return;
        }
        setError(insertError.message);
        return;
      }

      window.location.href = returnUrl;
    },
    [returnUrl]
  );

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const selectedBranchName =
    branches.find((b) => b.id === selectedBranchId)?.name ?? "";

  const inputClasses = "w-full rounded-xl border border-border px-4 py-3.5 text-foreground bg-background focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all duration-200";

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
        Complete your profile
      </h1>
      <p className="text-sm text-muted mb-8">
        We need a few details before you can continue.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-2">
            Full name
          </label>
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            {...register("full_name")}
            className={inputClasses}
            placeholder="John Doe"
          />
          {errors.full_name && <p className="text-sm text-danger mt-1.5">{errors.full_name.message}</p>}
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
            className={inputClasses}
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
            className={inputClasses}
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

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3" role="alert">
            <WarningCircleIcon size={18} weight="duotone" className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-foreground text-background rounded-full h-12 w-full font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {submitting ? (
            <>
              <Spinner size="sm" color="current" />
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </form>
    </div>
  );
}
