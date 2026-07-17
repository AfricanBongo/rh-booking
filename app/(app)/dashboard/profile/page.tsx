"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { type ChurchBranch } from "@/lib/data/profiles";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { PillButton } from "@/components/ui";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Invalid phone")
    .refine(
      (p) => {
        const digits = p.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 11;
      },
      "Phone must be 10-11 digits"
    ),
  gender: z.enum(["male", "female"]),
  age: z.number().int().positive("Age must be positive"),
  church_branch_id: z.string().uuid("Invalid church branch"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [branches, setBranches] = useState<ChurchBranch[]>([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const selectedGender = watch("gender");
  const selectedBranchId = watch("church_branch_id");
  const fullName = watch("full_name");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");

      const [profileRes, branchesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("church_branches").select("id, name").order("name"),
      ]);

      if (branchesRes.data) setBranches(branchesRes.data);
      if (profileRes.data) {
        const p = profileRes.data;
        reset({
          full_name: p.full_name,
          phone: p.phone,
          gender: p.gender,
          age: p.age,
          church_branch_id: p.church_branch_id,
        });
      }
      setLoading(false);
    };
    load();
  }, [reset]);

  const onSubmit = useCallback(
    async (data: ProfileFormData) => {
      setSaving(true);
      setError("");
      setSuccess(false);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone,
          gender: data.gender,
          age: data.age,
          church_branch_id: data.church_branch_id,
        })
        .eq("id", user.id);

      setSaving(false);
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    },
    []
  );

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const selectedBranchName =
    branches.find((b) => b.id === selectedBranchId)?.name ?? "";

  if (loading) {
    return (
      <main className="px-6 md:px-8 py-8 max-w-4xl animate-fade-up">
        <div className="w-full bg-surface rounded-2xl p-6 animate-pulse space-y-4">
          <div className="h-8 bg-default rounded w-1/3" />
          <div className="h-12 bg-default rounded" />
          <div className="h-12 bg-default rounded" />
          <div className="h-12 bg-default rounded" />
          <div className="h-12 bg-default rounded" />
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 md:px-8 py-8 max-w-4xl animate-fade-up">
      <div className="w-full bg-surface rounded-2xl p-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground mb-6">
          Edit Profile
        </h1>

        <div className="flex justify-center mb-6">
          <img
            src={getAvatarUrl(fullName ?? "")}
            alt="Avatar"
            className="w-20 h-20 rounded-full border-2 border-border transition-all"
          />
        </div>

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-success/10 text-success text-sm font-medium">
            Profile updated successfully
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl border border-border px-4 py-3 bg-default text-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted mt-1">Email cannot be changed</p>
          </div>

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
              {...register("full_name")}
              className="w-full rounded-xl border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
            />
            {errors.full_name && (
              <p className="text-sm text-danger mt-1">
                {errors.full_name.message}
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
              {...register("phone")}
              className="w-full rounded-xl border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
            />
            {errors.phone && (
              <p className="text-sm text-danger mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Gender
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setValue("gender", "male", { shouldValidate: true })
                }
                className={`flex-1 rounded-xl h-11 font-medium transition-colors ${
                  selectedGender === "male"
                    ? "bg-accent text-accent-foreground"
                    : "border border-border text-foreground hover:bg-default"
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() =>
                  setValue("gender", "female", { shouldValidate: true })
                }
                className={`flex-1 rounded-xl h-11 font-medium transition-colors ${
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
              className="w-full rounded-xl border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
            />
            {errors.age && (
              <p className="text-sm text-danger mt-1">{errors.age.message}</p>
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
              className="w-full rounded-xl border border-border px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-shadow"
              placeholder="Search church branch..."
            />
            {branchDropdownOpen && filteredBranches.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-surface border border-border rounded-xl shadow-md">
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

          {error && <p className="text-sm text-danger">{error}</p>}

          <PillButton type="submit" disabled={saving} fullWidth>
            {saving ? (
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
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </PillButton>
        </form>
      </div>
    </main>
  );
}
