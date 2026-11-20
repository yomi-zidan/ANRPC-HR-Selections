
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, X } from "lucide-react";

export default function EmployeeLayout({ children }) {
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("employee");

    if (!saved) {
      router.replace("/login");
      return;
    }

    try {
      setEmployee(JSON.parse(saved));
    } catch {
      sessionStorage.removeItem("employee");
      router.replace("/login");
    }
  }, [router]);

  function logout() {
    sessionStorage.removeItem("employee");
    router.replace("/login");
  }

  if (!employee) return null;

  return (
    <div dir="rtl" className="min-h-screen bg-[#F4F7FB]">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-[80px] items-center justify-between gap-4 px-5 py-3 lg:px-10">

          {/* Company */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#163B63] text-sm font-bold text-white">
              ANRPC
            </div>

            <div>
              <h1 className="text-base font-bold text-[#163B63] sm:text-lg">
                نظام الاختيارات الوظيفية
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                شركة الإسكندرية الوطنية للتكرير والبتروكيماويات
              </p>
            </div>
          </div>

          {/* Desktop employee info */}
          <div className="hidden items-center gap-5 sm:flex">
            <div className="text-left">
              <p className="text-sm font-bold text-[#163B63]">
                {employee.ename}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                رقم وظيفي: {employee.empn}
              </p>
            </div>

            <button
              type="button"
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              title="الإشعارات"
            >
              <Bell size={21} />
            </button>

            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-[#163B63] px-4 py-2 text-sm font-semibold text-[#163B63] hover:bg-blue-50"
            >
              تسجيل الخروج
            </button>
          </div>

          {/* Mobile menu */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-[#163B63] hover:bg-slate-100 sm:hidden"
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white p-4 sm:hidden">
            <div className="mb-4">
              <p className="font-bold text-[#163B63]">{employee.ename}</p>
              <p className="mt-1 text-xs text-slate-500">
                رقم وظيفي: {employee.empn}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg bg-[#163B63] px-4 py-3 text-sm font-semibold text-white"
            >
              <LogOut size={17} />
              تسجيل الخروج
            </button>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-5 py-4 text-center text-xs text-slate-500">
        جميع الحقوق محفوظة © شركة ANRPC
      </footer>
    </div>
  );
}
