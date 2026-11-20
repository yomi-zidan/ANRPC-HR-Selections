
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  Building2,
  RefreshCw,
  AlertCircle,
  Medal,
} from "lucide-react";

import { getHRRanking } from "@/services/hrService";

function RankNumber({ index }) {
  const styles = [
    "bg-amber-100 text-amber-800",
    "bg-slate-200 text-slate-700",
    "bg-orange-100 text-orange-800",
  ];

  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
        styles[index] || "bg-[#EAF0F8] text-[#163B63]"
      }`}
    >
      {index + 1}
    </span>
  );
}

function RankingTable({ title, icon: Icon, rows, type }) {
  return (
    <section className="rounded-2xl border border-[#D5DFEC] bg-white p-6 md:p-8">
      <div className="mb-7 flex items-center gap-3">
        <div className="rounded-xl bg-[#EAF0F8] p-3 text-[#163B63]">
          <Icon size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#102F5F]">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            ترتيب تنازلي حسب متوسط التقييم
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          لا توجد تقييمات مسجلة حتى الآن.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-right">
            <thead>
              <tr className="border-b-2 border-[#D5DFEC] text-sm text-slate-600">
                <th className="pb-4">الترتيب</th>
                <th className="pb-4">
                  {type === "employee" ? "الموظف" : "الإدارة"}
                </th>
                {type === "employee" && (
                  <th className="pb-4">الإدارة</th>
                )}
                <th className="pb-4 text-center">المشاركات المقيمة</th>
                <th className="pb-4 text-center">متوسط التقييم</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((item, index) => (
                <tr
                  key={
                    type === "employee"
                      ? item.empn
                      : item.department_id
                  }
                  className="border-b border-[#E5EAF1] last:border-0"
                >
                  <td className="py-5">
                    <RankNumber index={index} />
                  </td>

                  <td className="py-5 font-semibold text-slate-700">
                    {type === "employee"
                      ? item.employee_name
                      : item.department_name}
                    {index === 0 && (
                      <span className="mr-2 inline-flex items-center gap-1 text-xs text-amber-700">
                        <Medal size={15} />
                        المركز الأول
                      </span>
                    )}
                  </td>

                  {type === "employee" && (
                    <td className="py-5 text-sm text-slate-500">
                      {item.department_name || "—"}
                    </td>
                  )}

                  <td className="py-5 text-center text-slate-600">
                    {Number(item.evaluated_submissions)}
                  </td>

                  <td className="py-5 text-center font-bold text-amber-700" dir="ltr">
                    ★ {Number(item.average_rating).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function HRRankingPage() {
  const [data, setData] = useState({
    employees: [],
    departments: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRanking = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getHRRanking();
      setData(result);
    } catch (err) {
      setError(err.message || "تعذر تحميل الترتيب.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getHRRanking()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-[#F2F4F8] px-5 py-9 md:px-12">
      <div className="mx-auto max-w-[1600px]">

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/hr/dashboard"
              className="mb-4 inline-flex items-center gap-2 text-sm text-[#163B63] hover:underline"
            >
              العودة إلى لوحة الإدارات
            </Link>

            <h1 className="text-2xl font-bold text-[#102F5F]">
              الترتيب والتقييم
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              ترتيب الموظفين والإدارات بناءً على التقييمات المسجلة
            </p>
          </div>

          <button
            onClick={loadRanking}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#163B63] px-5 py-3 text-sm text-white hover:bg-[#0D2B4B] disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            تحديث الترتيب
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-600">
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center gap-3 text-[#163B63]">
            <RefreshCw size={22} className="animate-spin" />
            جاري تحميل الترتيب...
          </div>
        ) : (
          <>
            <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#D5DFEC] bg-white p-6">
                <div className="mb-3 flex items-center gap-3 text-slate-600">
                  <Users className="text-[#163B63]" size={21} />
                  عدد الموظفين الذين لديهم تقييمات
                </div>
                <p className="text-4xl font-bold text-[#142844]">
                  {data.employees.length}
                </p>
              </div>

              <div className="rounded-2xl border border-[#D5DFEC] bg-white p-6">
                <div className="mb-3 flex items-center gap-3 text-slate-600">
                  <Building2 className="text-[#163B63]" size={21} />
                  عدد الإدارات التي لديها تقييمات
                </div>
                <p className="text-4xl font-bold text-[#142844]">
                  {data.departments.length}
                </p>
              </div>
            </div>

            <div className="mb-7 rounded-2xl border border-[#D5DFEC] bg-white p-6">
              <div className="flex items-center gap-3">
                <Trophy size={27} className="text-amber-600" />
                <div>
                  <h2 className="font-bold text-[#102F5F]">
                    نتائج التقييم
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    يتم احتساب الترتيب من التقييمات المحفوظة في قاعدة البيانات.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-7">
              <RankingTable
                title="ترتيب الموظفين"
                icon={Users}
                rows={data.employees}
                type="employee"
              />

              <RankingTable
                title="ترتيب الإدارات"
                icon={Building2}
                rows={data.departments}
                type="department"
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
