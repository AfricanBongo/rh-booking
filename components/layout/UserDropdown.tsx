"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HouseIcon, UserCircleIcon, SignOutIcon, CurrencyDollarIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { getAvatarUrl } from "@/lib/utils/avatar";

interface UserDropdownProps {
  fullName: string;
  email: string;
}

export function UserDropdown({ fullName, email }: UserDropdownProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut(): Promise<void> {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function navigate(path: string): void {
    setOpen(false);
    router.push(path);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <img
          src={getAvatarUrl(fullName)}
          alt={fullName}
          width={36}
          height={36}
          className="w-9 h-9 rounded-full"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-surface shadow-lg p-2 animate-fade-in z-50">
          <div className="flex items-center gap-3 px-3 py-3">
            <img
              src={getAvatarUrl(fullName)}
              alt={fullName}
              width={36}
              height={36}
              className="w-9 h-9 rounded-full shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
              <p className="text-xs text-muted truncate">{email}</p>
            </div>
          </div>

          <div className="border-t border-border my-1" />

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-surface-secondary transition-colors"
          >
            <span>Dashboard</span>
            <HouseIcon size={16} className="text-muted" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/pay")}
            className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-surface-secondary transition-colors"
          >
            <span>Payments</span>
            <CurrencyDollarIcon size={16} className="text-muted" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/invitations")}
            className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-surface-secondary transition-colors"
          >
            <span>Invitations</span>
            <EnvelopeSimpleIcon size={16} className="text-muted" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard/profile")}
            className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-surface-secondary transition-colors"
          >
            <span>Profile</span>
            <UserCircleIcon size={16} className="text-muted" />
          </button>

          <div className="border-t border-border my-1" />

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-danger/5 transition-colors"
          >
            <span>Log Out</span>
            <SignOutIcon size={16} className="text-danger" />
          </button>
        </div>
      )}
    </div>
  );
}
