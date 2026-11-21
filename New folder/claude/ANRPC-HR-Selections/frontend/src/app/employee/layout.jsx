"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FilePlus2, FileText, LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, PageLoader } from "@/components/ui";
import { clearAuthSession, useSession } from "@/lib/auth";

const nav = [
  { href: "/employee/submissions", label: "مشاركاتي", icon: FileText, exact: true },
  { href: "/employee/submissions/new", label: "مشاركة جديدة", icon: FilePlus2, exact: true },
];

export default function EmployeeLayout({ children }) {
  const { ready, user } = useSession("employee");
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearAuthSession("employee");
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <PageLoader text="جاري التحقق من الجلسة..." />
      </div>
    );
  }

  // "مشاركاتي" stays highlighted on the details page as well, but not on /new
  const isActive = (item) =>
    item.href === "/employee/submissions"
      ? pathname === item.href || (pathname.startsWith(item.href + "/") && !pathname.startsWith(item.href + "/new"))
      : pathname === item.href;

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/employee/submissions" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white p-1.5 shadow-sm">
              <Image src="/images/anrpc-logo.png" alt="ANRPC" width={34} height={34} className="h-full w-full object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold">قصص النجاح والتميز</span>
              <span className="hidden text-[11px] text-fg-subtle sm:block">شركة الإسكندرية الوطنية للتكرير والبتروكيماويات</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item) ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive(item) ? "bg-primary-soft text-primary" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="hidden items-center gap-3 rounded-2xl border border-line py-1.5 pe-4 ps-1.5 sm:flex">
              <Avatar name={user?.ename} size={34} />
              <div className="leading-tight">
                <p className="max-w-44 truncate text-[13px] font-bold">{user?.ename}</p>
                <p className="max-w-44 truncate text-[11px] text-fg-subtle">{user?.edara_text || "الإدارة غير محددة"}</p>
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-10">{children}</main>

      <footer className="hidden border-t border-line bg-surface px-5 py-5 text-center text-xs text-fg-subtle md:block">
        جميع الحقوق محفوظة © {new Date().getFullYear()} شركة ANRPC
      </footer>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-2">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item) ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-3 text-[11px] font-semibold ${
                  isActive(item) ? "text-primary" : "text-fg-subtle"
                }`}
              >
                <item.icon size={21} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
