"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Trophy, SlidersHorizontal, Settings } from "lucide-react";

export const hrNav = [
  { href: "/hr/dashboard", label: "لوحة المتابعة", short: "الرئيسية", icon: LayoutDashboard },
  { href: "/hr/submissions", label: "المشاركات", short: "المشاركات", icon: ClipboardList },
  { href: "/hr/ranking", label: "الترتيب والتقييم", short: "الترتيب", icon: Trophy },
  { href: "/hr/criteria", label: "معايير التقييم", short: "المعايير", icon: SlidersHorizontal },
  { href: "/hr/settings", label: "إعدادات النظام", short: "الإعدادات", icon: Settings },
];

const isActive = (pathname, href) => pathname === href || pathname.startsWith(`${href}/`);

export default function HRSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[264px] flex-col bg-sidebar text-sidebar-fg md:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5">
            <Image src="/images/anrpc-logo.png" alt="ANRPC" width={34} height={34} className="h-full w-full object-contain" />
          </span>
          <div>
            <p className="text-[15px] font-extrabold text-white">ANRPC</p>
            <p className="text-[11px] text-sidebar-muted">بوابة الموارد البشرية</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          <p className="px-3 pb-2 text-[11px] font-bold tracking-wide text-sidebar-muted">القائمة الرئيسية</p>
          {hrNav.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                  active ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && <span className="absolute inset-y-2 start-0 w-1 rounded-e-full bg-accent" />}
                <Icon size={19} className={active ? "text-accent" : "text-sidebar-muted group-hover:text-sidebar-fg"} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold text-white">قصص النجاح والتميز</p>
          <p className="mt-1 text-[11px] leading-5 text-sidebar-muted">تابع المشاركات وقيّمها وأعلن النتائج من مكان واحد.</p>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-sidebar/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-lg items-stretch justify-between">
          {hrNav.map(({ href, short, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition ${
                    active ? "text-accent" : "text-sidebar-muted"
                  }`}
                >
                  <Icon size={21} />
                  {short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
