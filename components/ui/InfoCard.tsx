/**
 * InfoCard - Compact display card with icon, label, and value
 *
 * Used for key facts (dates, location, deadlines) on detail pages.
 * Features a colored icon container with rounded-xl shape.
 *
 * Usage:
 *   <InfoCard icon={<CalendarDotsIcon size={20} weight="duotone" />} label="Dates" value="Aug 14-17, 2026" />
 */

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function InfoCard({ icon, label, value }: InfoCardProps): React.ReactElement {
  return (
    <div className="border border-border bg-surface rounded-2xl p-4 flex items-start gap-3 hover-lift">
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 text-accent">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
