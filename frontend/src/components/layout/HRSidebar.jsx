
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Trophy,
  Users,
  SlidersHorizontal,
  Settings,
  LogOut,
  Award,
} from "lucide-react";

const menuItems = [
  { title: "لوحة التحكم", href: "/hr/dashboard", icon: LayoutDashboard },
  { title: "إدارة المشاركات", href: "/hr/submissions", icon: ClipboardList },
  { title: "الترتيب والتقييم", href: "/hr/ranking", icon: Trophy },
  { title: "إدارة الموظفين", href: "/hr/employees", icon: Users },
  { title: "إدارة المعايير", href: "/hr/criteria", icon: SlidersHorizontal },
  { title: "الإعدادات", href: "/hr/settings", icon: Settings },
];

export default function HRSidebar() {
  const pathname = usePathname();

  function handleLogout() {
    sessionStorage.removeItem("hr_token");
    sessionStorage.removeItem("hr_user");
    window.location.href = "/login";
  }

  return (
    <aside
      dir="rtl"
      className="fixed right-0 top-0 z-40 flex h-screen w-[260px] flex-col overflow-hidden bg-[#102D50] text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(8, 29, 55, 0.91), rgba(8, 29, 55, 0.96)), url('/images/sidebar.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative flex h-24 shrink-0 items-center gap-3 border-b border-white/15 px-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10">
          <Award size={27} />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-wide">HR Selections</h2>
          <p className="mt-1 text-xs text-blue-200">إدارة المسابقة</p>
        </div>
      </div>

      <nav className="relative flex-1 space-y-2 overflow-y-auto px-4 py-7">
        <p className="mb-4 px-3 text-[11px] font-semibold tracking-wider text-blue-200/70">
          القائمة الرئيسية
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/hr/dashboard" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm transition-all duration-200 ${
                active
                  ? "border-white/20 bg-white text-[#163B63] font-bold shadow-lg"
                  : "border-transparent text-blue-100 hover:border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                size={19}
                className={
                  active
                    ? "text-[#163B63]"
                    : "text-blue-200 group-hover:text-white"
                }
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-white/15 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-blue-100 transition hover:bg-red-500/20 hover:text-white"
        >
          <LogOut size={19} />
          تسجيل الخروج
        </button>
        <p className="mt-3 text-center text-[10px] text-blue-200/60">
          ANRPC • HR Selections
        </p>
      </div>
    </aside>
  );
}
