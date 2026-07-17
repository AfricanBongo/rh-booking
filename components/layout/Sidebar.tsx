"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HouseIcon,
  CalendarDotsIcon,
  CurrencyDollarIcon,
  EnvelopeSimpleIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  SignOutIcon,
  PushPinIcon,
  PushPinSlashIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { getAvatarUrl } from "@/lib/utils/avatar";

interface SidebarProps {
  fullName: string;
  email: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: HouseIcon, href: "/dashboard" },
  { label: "Conferences", icon: CalendarDotsIcon, href: "/dashboard/conferences" },
  { label: "Payments", icon: CurrencyDollarIcon, href: "/pay" },
  { label: "Invitations", icon: EnvelopeSimpleIcon, href: "/invitations" },
  { label: "Merch", icon: ShoppingBagIcon, href: "/dashboard/merch" },
  { label: "Profile", icon: UserCircleIcon, href: "/dashboard/profile" },
] as const;

export function Sidebar({ fullName, email }: SidebarProps): React.ReactElement {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("sidebar-pinned");
    if (stored === "true") {
      setPinned(true);
      document.documentElement.classList.add("sidebar-pinned");
    }
  }, []);

  function togglePin(): void {
    const next = !pinned;
    setPinned(next);
    localStorage.setItem("sidebar-pinned", String(next));
    if (next) {
      document.documentElement.classList.add("sidebar-pinned");
    } else {
      document.documentElement.classList.remove("sidebar-pinned");
    }
  }

  async function handleSignOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  const expanded = pinned || hovered;
  const avatarUrl = getAvatarUrl(fullName);
  const { theme, setTheme } = useTheme();

  function cycleTheme(): void {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  const ThemeIcon = !mounted ? SunIcon : theme === "dark" ? MoonIcon : theme === "light" ? SunIcon : MonitorIcon;
  const themeLabel = !mounted ? "Light" : theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`hidden md:flex fixed left-0 top-0 h-screen z-40 flex-col bg-surface border-r border-border transition-all duration-300 ${
        expanded ? "w-64" : "w-16"
      }`}
    >
      <div className={`flex items-center h-14 px-4 border-b border-border ${expanded ? "justify-start" : "justify-center"}`}>
        <Link href="/dashboard" className="font-heading font-bold text-lg tracking-tight truncate">
          {expanded ? "RoyalHouse" : "R"}
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-surface-secondary"
              }`}
              title={!expanded ? item.label : undefined}
            >
              <item.icon size={20} weight={active ? "fill" : "regular"} className="shrink-0" />
              {expanded && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-2 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <img
            src={avatarUrl}
            alt={fullName}
            width={32}
            height={32}
            className="rounded-full shrink-0"
          />
          {expanded && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
              <p className="text-xs text-muted truncate">{email}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={cycleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-secondary transition-all duration-300 w-full"
          title={!expanded ? themeLabel : undefined}
        >
          <ThemeIcon size={20} weight="regular" className="shrink-0" />
          {expanded && <span>{themeLabel}</span>}
        </button>

        <button
          type="button"
          onClick={togglePin}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-secondary transition-all duration-300 w-full"
          title={!expanded ? (pinned ? "Unpin" : "Pin") : undefined}
        >
          {pinned ? <PushPinSlashIcon size={20} weight="regular" className="shrink-0" /> : <PushPinIcon size={20} weight="regular" className="shrink-0" />}
          {expanded && <span>{pinned ? "Unpin" : "Pin"}</span>}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-secondary transition-all duration-300 w-full"
          title={!expanded ? "Log Out" : undefined}
        >
          <SignOutIcon size={20} weight="regular" className="shrink-0" />
          {expanded && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
