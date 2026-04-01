"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "colsync_theme";

export default function ThemeToggle() {
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [manualTheme, setManualTheme] = useState<"light" | "dark" | null>(null);

  const theme = useMemo<"light" | "dark">(() => {
    if (!hydrated) return "light";
    if (manualTheme) return manualTheme;

    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, [hydrated, manualTheme]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [hydrated, theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setManualTheme(nextTheme);
  };

  if (!hydrated) return <div className="w-9 h-9" />;

  return (
    <button
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
