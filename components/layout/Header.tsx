import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MobileMenu } from "@/components/layout/MobileMenu";

export async function Header(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : null;

  return (
    <header className="sticky top-0 z-50 h-14 md:h-16 bg-surface/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link href="/" className="font-heading font-bold text-lg">
          RoyalHouse <span className="text-accent">Booking</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/conferences" className="text-sm text-foreground hover:text-accent transition-colors">
            Conferences
          </Link>
          <Link href="/merch" className="text-sm text-foreground hover:text-accent transition-colors">
            Merch
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-foreground hover:text-accent transition-colors">
                Dashboard
              </Link>
              <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
                {initials}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="border border-border text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-secondary transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Register
              </Link>
            </>
          )}
        </nav>

        <MobileMenu isLoggedIn={!!user} />
      </div>
    </header>
  );
}
