"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ className = "", variant = "default" }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // storage might be blocked
    }
  }

  const styles =
    variant === "glass"
      ? "border-white/15 bg-white/10 text-white hover:bg-white/20"
      : "border-line bg-surface text-fg-muted hover:bg-surface-2 hover:text-fg";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
      title={dark ? "الوضع الفاتح" : "الوضع الداكن"}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${styles} ${className}`}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
