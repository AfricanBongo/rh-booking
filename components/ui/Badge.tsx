/**
 * Badge - Custom chip/badge component
 *
 * A small pill-shaped indicator for status, dates, or labels.
 * Unlike HeroUI Chip, this supports custom color overrides via className
 * without fighting default styles.
 *
 * Variants:
 * - soft (default): light accent bg with accent text
 * - outline: border only, transparent bg
 * - solid: filled accent bg with white text
 * - glass: translucent white bg for use on dark/image backgrounds
 *
 * Sizes:
 * - sm: text-xs px-2 py-0.5
 * - md: text-sm px-3 py-1 (default)
 */

type Variant = "soft" | "outline" | "solid" | "glass";
type Size = "sm" | "md";

interface BadgeProps {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  soft: "bg-accent/10 text-accent",
  outline: "border border-border text-muted",
  solid: "bg-accent text-accent-foreground",
  glass: "bg-white/15 text-white border border-white/20 backdrop-blur-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-3 py-1 gap-1.5",
};

export function Badge({
  variant = "soft",
  size = "md",
  children,
  className = "",
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={[
        "inline-flex items-center font-medium rounded-full",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
