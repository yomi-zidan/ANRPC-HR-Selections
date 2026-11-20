
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ClipboardCheck,
  Building2,
  Trophy,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { getHRDashboard } from "@/services/hrService";

// ========================================
// Statistics Card
// ========================================
function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="flex min-h-[195px] min-w-[160px] flex-col justify-center rounded-2xl border border-[#D5DFEC] bg-white p-7">
      <div className="mb-6 flex items-center justify-between gap-3 text-base text-slate-600">
        <span>{title}</span>
        <Icon size={22} className="shrink-0 text-[#163B63]" />
      </div>

      <div className="text-4xl font-bold text-[#142844]" dir="ltr">
        {Number(value || 0).toLocaleString("en-US")}
      </div>
    </div>
  );
}

// ========================================
// Loading State
// ========================================
function DashboardLoading() {
  return (
    <main
      dir="rtl"
      className="flex min-h-[60vh] items-center justify-center bg-[#F2F4F8]"
    >
      <div className="flex items-center gap-3 text-[#163B63]">
        <RefreshCw size={22} className="animate-spin" />
        <span>جاري تحميل بيانات لوحة التحكم...</span>
      </div>
    </main>
  );
}

// ========================================
// Error State
// ========================================
function DashboardError({ message, onRetry }) {
  return (
    <main
      dir="rtl"
      className="min-h-[60vh] bg-[#F2F4F8] px-5 py-10 md:px-12"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 text-center">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={35} />

        <p className="mb-6 text-red-600">{message}</p>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-[#102F5F] px-7 py-3 text-white transition hover:bg-[#0B2449]"
        >
          <RefreshCw size={17} />
          إعادة المحاولة
        </button>
      </div>
    </main>
  );
}

// ========================================
// Main HR Dashboard
// ========================================
export default function HRDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load Dashboard Data
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getHRDashboard();

      setData(result);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل بيانات لوحة التحكم.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial API Request
  useEffect(() => {
    let active = true;

    getHRDashboard()
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.message || "حدث خطأ أثناء تحميل بيانات لوحة التحكم."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Loading
  if (loading) {
    return <DashboardLoading />;
  }

  // Error
  if (error) {
    return (
      <DashboardError
        message={error}
        onRetry={loadDashboard}
      />
    );
  }

  const departments = data?.departments || [];

  // Dashboard UI
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F2F4F8] px-5 py-10 md:px-12"
    >
      <div className="mx-auto max-w-[1600px]">

        {/* ================================= */}
        {/* Statistics Section */}
        {/* ================================= */}

        <div className="mb-16 flex flex-wrap items-start justify-between gap-6">

          <Link
            href="/hr/ranking"
            className="flex items-center gap-2 rounded-xl bg-[#102F5F] px-7 py-4 font-semibold text-white transition hover:bg-[#0B2449]"
          >
            <Trophy size={19} />
            الترتيب
          </Link>

          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-3 lg:w-auto">

            <StatCard
              title="إجمالي المشاركات"
              value={data?.total_submissions}
              icon={Users}
            />

            <StatCard
              title="تم تقييمها"
              value={data?.evaluated_submissions}
              icon={ClipboardCheck}
            />

            <StatCard
              title="الإدارات"
              value={data?.total_departments}
              icon={Building2}
            />

          </div>
        </div>

        {/* ================================= */}
        {/* Departments Table */}
        {/* ================================= */}

        <section className="rounded-2xl border border-[#D5DFEC] bg-white p-6 md:p-9">

          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">

            <h2 className="text-xl font-bold text-[#102F5F]">
              الإدارات
            </h2>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-[#D5DFEC] px-4 py-2 text-sm text-[#163B63] transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              تحديث البيانات
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[750px] text-right">

              <thead>
                <tr className="border-b-2 border-[#D5DFEC] text-lg font-semibold text-[#142844]">

                  <th className="pb-5">
                    الإدارة
                  </th>

                  <th className="pb-5 text-center">
                    المشاركون
                  </th>

                  <th className="pb-5 text-center">
                    متوسط التقييم
                  </th>

                  <th className="pb-5 text-left">
                    &nbsp;
                  </th>

                </tr>
              </thead>

              <tbody>

                {departments.map((department) => {
                  const average = Number(
                    department.average_rating || 0
                  );

                  return (
                    <tr
                      key={department.id}
                      className="border-b border-[#E5EAF1] transition last:border-0 hover:bg-slate-50/70"
                    >

                      <td className="py-5 font-medium text-slate-700">
                        {department.name}
                      </td>

                      <td
                        className="py-5 text-center text-slate-700"
                        dir="ltr"
                      >
                        {Number(
                          department.participants_count || 0
                        ).toLocaleString("en-US")}
                      </td>

                      <td className="py-5 text-center">

                        {average > 0 ? (
                          <span
                            className="font-semibold text-amber-700"
                            dir="ltr"
                          >
                            ★ {average.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            لا يوجد تقييم
                          </span>
                        )}

                      </td>

                      <td className="py-4 text-left">

                        <Link
                          href={`/hr/employees?department=${department.id}`}
                          className="inline-block min-w-44 rounded-xl border border-[#163B70] px-5 py-3 text-center text-[#163B70] transition hover:bg-[#163B70] hover:text-white"
                        >
                          عرض الموظفين
                        </Link>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

            {departments.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                لا توجد إدارات مسجلة في قاعدة البيانات.
              </div>
            )}

          </div>
        </section>

      </div>
    </main>
  );
}
