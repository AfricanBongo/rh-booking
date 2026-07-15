/**
 * PillButton - Custom CTA button component
 *
 * A pill-shaped (rounded-full) button used for primary CTAs throughout the app.
 * Supports rendering as a link (via href) or as a button element.
 *
 * Variants:
 * - primary (default): accent bg, white text
 * - dark: foreground bg, background text (used on auth pages)
 * - outline: transparent bg, border, foreground text
 * - ghost: no border, subtle hover bg
 *
 * Sizes:
 * - sm: h-9 px-4 text-sm
 * - md: h-11 px-6 text-sm (default)
 * - lg: h-12 px-8 text-base
 *
 * Animation: scale-[1.02] on hover, scale-[0.98] on active press.
 */
import Link from "next/link";

type Variant = "primary" | "dark" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface PillButtonBaseProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
}

interface PillButtonLinkProps extends PillButtonBaseProps {
  href: string;
  disabled?: never;
  type?: never;
  onClick?: never;
}

interface PillButtonActionProps extends PillButtonBaseProps {
  href?: never;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}

export type PillButtonProps = PillButtonLinkProps | PillButtonActionProps;

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:opacity-90",
  dark:
    "bg-foreground text-background hover:opacity-90",
  outline:
    "border border-border text-foreground hover:bg-surface-secondary",
  ghost:
    "text-foreground hover:bg-surface-secondary",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
};

export function PillButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  className = "",
  ...props
}: PillButtonProps): React.ReactElement {
  const classes = [
    "inline-flex items-center justify-center gap-2 font-medium rounded-full",
    "transition-all duration-200 ease-out",
    "hover:scale-[1.02] active:scale-[0.98]",
    "disabled:opacity-50 disabled:pointer-events-none",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ].join(" ");

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { disabled, type = "button", onClick } = props as PillButtonActionProps;

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
