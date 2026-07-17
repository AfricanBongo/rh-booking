"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface MobileMenuProps {
  isLoggedIn: boolean;
}

export function MobileMenu({ isLoggedIn }: MobileMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleSignOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/auth/login");
  }

  return (
    <div ref={menuRef} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-2 text-foreground"
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M6 18L18 6" />
            </>
          ) : (
            <>
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg py-2 z-50">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-secondary"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/conferences"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-secondary"
              >
                Conferences
              </Link>
              <Link
                href="/pay"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-secondary"
              >
                Payments
              </Link>
              <Link
                href="/invitations"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-secondary"
              >
                Invitations
              </Link>
              <Link
                href="/dashboard/merch"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-secondary"
              >
                Merch
              </Link>
              <Link
                href="/dashboard/profile"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-secondary"
              >
                Profile
              </Link>
              <div className="border-t border-border my-1" />
              <button
                type="button"
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-surface-secondary"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/conferences"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-secondary"
              >
                Conferences
              </Link>
              <Link
                href="/merch"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-secondary"
              >
                Merch
              </Link>
              <div className="border-t border-border my-1" />
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-secondary"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface-secondary"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
