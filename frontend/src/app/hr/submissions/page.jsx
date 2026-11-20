
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Search,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Clock,
  Eye,
  X,
  AlertCircle,
  Filter,
  Star,
} from "lucide-react";

import { getHRSubmissions } from "@/services/hrService";

const initialFilters = {
  search: "",
  department: "",
  type: "",
  evaluation: "",
};

// Statistics Card
function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-3 text-3xl font-bold text-[#163B63]">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

// Evaluation Status
function EvaluationBadge({ evaluated }) {
  return evaluated ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
      <CheckCircle2 size={14} />
      تم التقييم
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
      <Clock size={14} />
      في انتظار التقييم
    </span>
  );
}

// Submission Type
function SubmissionTypeBadge({ type }) {
  const isIndividual = Number(type) === 1;

  return (
    <span
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
        isIndividual
          ? "bg-blue-50 text-blue-700"
          : "bg-purple-50 text-purple-700"
      }`}
    >
      {isIndividual ? "فردية" : "جماعية"}
    </span>
  );
}

export default function HRSubmissionsPage() {
  const [filters, setFilters] = useState(initialFilters);

  const [data, setData] = useState({
    submissions: [],
    departments: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Load Submissions
  useEffect(() => {
    let cancelled = false;

    async function fetchSubmissions() {
      try {
        setLoading(true);
        setError("");

        const result = await getHRSubmissions(filters);

        if (cancelled) return;

        const submissions = Array.isArray(result.submissions)
          ? result.submissions
          : Array.isArray(result)
            ? result
            : [];

        const departments = Array.isArray(result.departments)
          ? result.departments
          : [];

        setData({
          submissions,
          departments,
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "تعذر تحميل المشاركات."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    // Delay requests while typing in search
    const timer = setTimeout(() => {
      fetchSubmissions();
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters, refreshKey]);

  // Update Filters
  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // Clear Filters
  function clearFilters() {
    setFilters({ ...initialFilters });
  }

  // Refresh
  function refreshData() {
    setRefreshKey((current) => current + 1);
  }

  const submissions = data.submissions;

  const evaluatedCount = submissions.filter(
    (item) => Number(item.review_count) > 0
  ).length;

  const pendingCount = submissions.length - evaluatedCount;

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-[1600px] space-y-7"
    >
      {/* ================= Page Header ================= */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#163B63]">
            إدارة المشاركات
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            استعراض ومتابعة جميع المشاركات المقدمة في المسابقة
          </p>
        </div>

        <button
          type="button"
          onClick={refreshData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#163B63] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0D2B4B] disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />

          تحديث البيانات
        </button>
      </div>

      {/* ================= Statistics ================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="إجمالي المشاركات"
          value={loading ? "—" : submissions.length}
          icon={ClipboardList}
          color="bg-blue-50 text-blue-700"
        />

        <StatCard
          title="المشاركات التي تم تقييمها"
          value={loading ? "—" : evaluatedCount}
          icon={CheckCircle2}
          color="bg-green-50 text-green-700"
        />

        <StatCard
          title="المشاركات في انتظار التقييم"
          value={loading ? "—" : pendingCount}
          icon={Clock}
          color="bg-amber-50 text-amber-700"
        />
      </div>

      {/* ================= Filters ================= */}

      <section className="rounded-2xl border border-[#DCE4EF] bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter
              size={19}
              className="text-[#163B63]"
            />

            <h2 className="font-bold text-[#163B63]">
              البحث والتصفية
            </h2>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600"
          >
            <X size={15} />
            مسح الفلاتر
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              البحث
            </label>

            <div className="relative">
              <Search
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  updateFilter("search", e.target.value)
                }
                placeholder="اسم الموظف، الرقم الوظيفي، عنوان المشاركة..."
                className="h-11 w-full rounded-xl border border-[#DCE4EF] bg-[#FAFBFD] pr-10 pl-3 text-sm outline-none transition focus:border-[#163B63] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              الإدارة
            </label>

            <select
              value={filters.department}
              onChange={(e) =>
                updateFilter("department", e.target.value)
              }
              className="h-11 w-full rounded-xl border border-[#DCE4EF] bg-[#FAFBFD] px-3 text-sm outline-none focus:border-[#163B63]"
            >
              <option value="">كل الإدارات</option>

              {data.departments.map((department, index) => {
                const departmentId =
                  department.department_id ??
                  department.id ??
                  department.edara_code ??
                  department.edaraCode;

                const departmentName =
                  department.department_name ??
                  department.edara_text ??
                  department.name ??
                  "إدارة";

                const uniqueKey =
                  departmentId !== null &&
                  departmentId !== undefined
                    ? `department-${departmentId}`
                    : `department-${departmentName}-${index}`;

                return (
                  <option
                    key={uniqueKey}
                    value={
                      departmentId !== null &&
                      departmentId !== undefined
                        ? String(departmentId)
                        : ""
                    }
                    disabled={
                      departmentId === null ||
                      departmentId === undefined
                    }
                  >
                    {departmentName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Submission Type */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              نوع المشاركة
            </label>

            <select
              value={filters.type}
              onChange={(e) =>
                updateFilter("type", e.target.value)
              }
              className="h-11 w-full rounded-xl border border-[#DCE4EF] bg-[#FAFBFD] px-3 text-sm outline-none focus:border-[#163B63]"
            >
              <option value="">كل الأنواع</option>
              <option value="1">فردية</option>
              <option value="2">جماعية</option>
            </select>
          </div>

          {/* Evaluation Status */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              حالة التقييم
            </label>

            <select
              value={filters.evaluation}
              onChange={(e) =>
                updateFilter("evaluation", e.target.value)
              }
              className="h-11 w-full rounded-xl border border-[#DCE4EF] bg-[#FAFBFD] px-3 text-sm outline-none focus:border-[#163B63]"
            >
              <option value="">كل الحالات</option>
              <option value="evaluated">تم التقييم</option>
              <option value="pending">في انتظار التقييم</option>
            </select>
          </div>
        </div>
      </section>

      {/* ================= Error Message ================= */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>{error}</div>
        </div>
      )}

      {/* ================= Submissions Table ================= */}

      <section className="overflow-hidden rounded-2xl border border-[#DCE4EF] bg-white shadow-sm">

        {/* Table Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EDF4] px-5 py-5 md:px-6">
          <div>
            <h2 className="font-bold text-[#163B63]">
              قائمة المشاركات
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              المشاركات المسجلة في قاعدة البيانات
            </p>
          </div>

          <span className="rounded-lg bg-[#EAF0F8] px-3 py-2 text-xs font-bold text-[#163B63]">
            {loading ? "..." : `${submissions.length} مشاركة`}
          </span>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-[#163B63]">
            <RefreshCw
              size={20}
              className="animate-spin"
            />

            جاري تحميل المشاركات...
          </div>
        ) : submissions.length === 0 ? (

          /* Empty State */
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <ClipboardList
              size={42}
              className="mb-4 text-slate-300"
            />

            <p className="font-semibold text-slate-600">
              لا توجد مشاركات مطابقة
            </p>

            <p className="mt-2 text-sm text-slate-400">
              جرّبي تغيير كلمات البحث أو الفلاتر.
            </p>
          </div>

        ) : (

          /* Data Table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-right">

              <thead className="bg-[#F7F9FC] text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-4">الموظف</th>
                  <th className="px-5 py-4">عنوان المشاركة</th>
                  <th className="px-5 py-4">الإدارة</th>
                  <th className="px-5 py-4">النوع</th>
                  <th className="px-5 py-4">تاريخ التقديم</th>
                  <th className="px-5 py-4">التقييم</th>
                  <th className="px-5 py-4 text-center">
                    متوسط النجوم
                  </th>
                  <th className="px-5 py-4 text-center">
                    التفاصيل
                  </th>
                </tr>
              </thead>

              <tbody>
                {submissions.map((item, index) => {
                  const evaluated =
                    Number(item.review_count) > 0;

                  const submissionId =
                    item.id ?? item.submission_id;

                  return (
                    <tr
                      key={
                        submissionId ??
                        `submission-${index}`
                      }
                      className="border-t border-[#EDF1F6] transition hover:bg-[#FAFBFD]"
                    >
                      {/* Employee */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-700">
                          {item.employee_name || "—"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          الرقم الوظيفي: {item.empn ?? "—"}
                        </p>
                      </td>

                      {/* Title */}
                      <td className="max-w-[260px] px-5 py-4">
                        <p className="truncate text-sm font-semibold text-[#163B63]">
                          {item.title || "—"}
                        </p>

                        {item.location && (
                          <p className="mt-1 text-xs text-slate-400">
                            {item.location}
                          </p>
                        )}
                      </td>

                      {/* Department */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.department_name || "—"}
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        <SubmissionTypeBadge
                          type={item.submission_type}
                        />
                      </td>

                      {/* Date */}
                      <td
                        className="px-5 py-4 text-sm text-slate-500"
                        dir="ltr"
                      >
                        {item.created_at
                          ? new Date(
                              item.created_at
                            ).toLocaleDateString("ar-EG")
                          : "—"}
                      </td>

                      {/* Evaluation */}
                      <td className="px-5 py-4">
                        <EvaluationBadge
                          evaluated={evaluated}
                        />
                      </td>

                      {/* Average Rating */}
                      <td className="px-5 py-4 text-center">
                        {evaluated ? (
                          <span
                            className="inline-flex items-center gap-1 font-bold text-amber-600"
                            dir="ltr"
                          >
                            <Star
                              size={15}
                              fill="currentColor"
                            />

                            {Number(
                              item.average_rating || 0
                            ).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            —
                          </span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="px-5 py-4 text-center">
                        {submissionId ? (
                          <Link
                            href={`/hr/submissions/${submissionId}`}
                            title="عرض تفاصيل المشاركة"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF0F8] text-[#163B63] transition hover:bg-[#163B63] hover:text-white"
                          >
                            <Eye size={18} />
                          </Link>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
