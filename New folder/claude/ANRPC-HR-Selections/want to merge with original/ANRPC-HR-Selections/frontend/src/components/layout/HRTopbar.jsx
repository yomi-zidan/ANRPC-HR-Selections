"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar } from "@/components/ui";
import { clearAuthSession } from "@/lib/auth";
import { hrNav } from "./HRSidebar";

export default function HRTopbar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const current =
    hrNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ||
    "بوابة الموارد البشرية";

  function logout() {
    clearAuthSession("hr");
    router.replace("/login?role=hr");
  }

  const name = user?.full_name || user?.username || "مستخدم HR";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-line bg-surface/85 px-4 backdrop-blur-xl md:px-8">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-fg-subtle">نظام الاختيارات الوظيفية</p>
        <h2 className="truncate text-base font-extrabold">{current}</h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <div className="hidden items-center gap-3 rounded-2xl border border-line bg-surface py-1.5 pe-4 ps-1.5 sm:flex">
          <Avatar name={name} size={34} />
          <div className="leading-tight">
            <p className="max-w-40 truncate text-[13px] font-bold">{name}</p>
            <p className="text-[11px] text-fg-subtle">الموارد البشرية</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-fg-muted transition hover:bg-danger-bg hover:text-danger-fg"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
