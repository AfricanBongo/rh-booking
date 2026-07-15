/**
 * SectionHeader - Consistent section title pattern
 *
 * Used throughout the marketing site for section intros.
 * Supports optional overline, subtitle, and a "View all" style link.
 *
 * Usage:
 *   <SectionHeader title="Upcoming Conferences" subtitle="More gatherings on the horizon." linkHref="/conferences" linkText="View all" />
 */
import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";

interface SectionHeaderProps {
  overline?: string;
  title: string;
  subtitle?: string;
  linkHref?: string;
  linkText?: string;
  centered?: boolean;
}

export function SectionHeader({ overline, title, subtitle, linkHref, linkText, centered = false }: SectionHeaderProps): React.ReactElement {
  return (
    <div className={`flex items-end justify-between mb-10 ${centered ? "flex-col items-center text-center" : ""}`}>
      <div>
        {overline && (
          <p className="text-sm font-medium text-accent uppercase tracking-wide mb-1">{overline}</p>
        )}
        <h2 className="font-heading text-2xl md:text-4xl font-semibold mb-2">{title}</h2>
        {subtitle && <p className="text-muted max-w-md">{subtitle}</p>}
      </div>
      {linkHref && linkText && (
        <Link href={linkHref} className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
          {linkText} <CaretRightIcon size={16} />
        </Link>
      )}
    </div>
  );
}
