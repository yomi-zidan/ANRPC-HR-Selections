
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, UserCircle } from "lucide-react";

const pageTitles = [
  { path: "/hr/dashboard", title: "لوحة التحكم" },
  { path: "/hr/submissions", title: "إدارة المشاركات" },
  { path: "/hr/ranking", title: "الترتيب والتقييم" },
  { path: "/hr/employees", title: "إدارة الموظفين" },
  { path: "/hr/criteria", title: "إدارة المعايير" },
  { path: "/hr/settings", title: "الإعدادات" },
];

export default function HRTopbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      setUser(JSON.parse(sessionStorage.getItem("hr_user") || "null"));
    } catch {
      setUser(null);
    }
  }, []);

  const currentPage = pageTitles.find(
    (item) =>
      pathname === item.path || pathname.startsWith(`${item.path}/`)
  );

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E3E9F1] bg-white/95 px-5 shadow-sm backdrop-blur md:px-8"
    >
      <div>
        <h1 className="text-lg font-bold text-[#163B63]">
          {currentPage?.title || "الموارد البشرية"}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          نظام إدارة واختيار المشاركات
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold text-[#163B63]">
            {user?.FullName || user?.full_name || "مسؤول الموارد البشرية"}
          </p>
          <p className="mt-1 text-xs text-slate-500">HR Administrator</p>
        </div>

        <UserCircle size={35} className="text-[#163B63]" />
      </div>
    </header>
  );
}
