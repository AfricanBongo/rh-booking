export function Footer(): React.ReactElement {
  return (
    <footer className="bg-surface border-t border-border py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="font-heading font-bold">
            RoyalHouse <span className="text-accent">Booking</span>
          </p>
          <p className="text-xs text-muted">
            &copy; 2026 RoyalHouse Chapel International
          </p>
        </div>
        <div className="flex gap-4 text-sm text-muted">
          <a
            href="https://royalhousechapel.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            royalhousechapel.org
          </a>
          <a
            href="mailto:support@royalhouse.org"
            className="hover:text-foreground transition-colors"
          >
            support@royalhouse.org
          </a>
        </div>
      </div>
    </footer>
  );
}
