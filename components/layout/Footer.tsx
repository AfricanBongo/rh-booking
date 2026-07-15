import Link from "next/link";

export function Footer(): React.ReactElement {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <p className="font-heading font-bold text-lg mb-2">RoyalHouse</p>
            <p className="text-sm text-muted leading-relaxed">
              Conference booking for RoyalHouse Chapel International. All branches, one family.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Conference</p>
            <ul className="space-y-2">
              <li>
                <Link href="/conferences" className="text-sm text-muted hover:text-foreground transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link href="/merch" className="text-sm text-muted hover:text-foreground transition-colors">
                  Conference Gear
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-sm text-muted hover:text-foreground transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* For members */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">For Members</p>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-sm text-muted hover:text-foreground transition-colors">
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link href="/invitations" className="text-sm text-muted hover:text-foreground transition-colors">
                  Invitations
                </Link>
              </li>
              <li>
                <Link href="/pay" className="text-sm text-muted hover:text-foreground transition-colors">
                  Make a Payment
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Connect</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://royalhousechapel.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  royalhousechapel.org
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@royalhouse.org"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  support@royalhouse.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} RoyalHouse Chapel International. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Built with care for the body of Christ.
          </p>
        </div>
      </div>
    </footer>
  );
}
