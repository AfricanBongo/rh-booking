"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { SunIcon, MoonIcon, MonitorIcon } from "@phosphor-icons/react";

export function ThemeToggle(): React.ReactElement | null {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  function cycleTheme(): void {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      onPress={cycleTheme}
      className="rounded-full w-9 h-9 text-muted hover:text-foreground"
      aria-label={`Theme: ${theme}. Click to change.`}
    >
      {theme === "dark" ? (
        <MoonIcon size={18} weight="duotone" />
      ) : theme === "light" ? (
        <SunIcon size={18} weight="duotone" />
      ) : (
        <MonitorIcon size={18} weight="duotone" />
      )}
    </Button>
  );
}
