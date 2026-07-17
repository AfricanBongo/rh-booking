"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretRightIcon } from "@phosphor-icons/react";

export function Breadcrumbs(): React.ReactElement {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
        const isLast = index === segments.length - 1;

        return (
          <span key={href} className="flex items-center gap-1.5">
            {index > 0 && <CaretRightIcon size={12} className="text-muted" />}
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link href={href} className="text-muted hover:text-foreground transition-colors duration-200">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
