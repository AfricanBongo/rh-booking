import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PillButton } from "@/components/ui";
import { UserDropdown } from "@/components/layout/UserDropdown";

export async function Header(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let fullName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    fullName = profile?.full_name ?? "";
  }

  return (
    <header className="sticky top-0 z-50 h-16 md:h-18 bg-surface/90 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link href="/" className="font-heading font-bold text-xl tracking-tight">
          RoyalHouse
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/conferences" className="text-sm font-medium text-muted hover:text-foreground transition-colors duration-200">
            Conferences
          </Link>
          <Link href="/merch" className="text-sm font-medium text-muted hover:text-foreground transition-colors duration-200">
            Merch
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-foreground transition-colors duration-200">
                Dashboard
              </Link>
              <ThemeToggle />
              <UserDropdown fullName={fullName} email={user.email ?? ""} />
            </>
          ) : (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/auth/login"
                className="text-sm font-medium text-foreground hover:text-accent transition-colors duration-200"
              >
                Sign in
              </Link>
              <PillButton href="/auth/register" variant="dark" size="sm">
                Get started
              </PillButton>
            </div>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <MobileMenu isLoggedIn={!!user} />
        </div>
      </div>
    </header>
  );
}
