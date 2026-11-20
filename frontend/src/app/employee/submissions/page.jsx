
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  CalendarDays,
  Paperclip,
  RefreshCw,
  Loader2,
  Inbox,
  ArrowLeft,
  Users,
  UserRound,
  MapPin,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function MySubmissions() {
  const router = useRouter();

  const [employee, setEmployee] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSubmissions = useCallback(async () => {
    const token = sessionStorage.getItem("auth_token");
    const savedEmployee = sessionStorage.getItem("employee");

    if (!token || !savedEmployee) {
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      setEmployee(JSON.parse(savedEmployee));

      const response = await fetch(
        `${API_URL}/employee/submissions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("employee");
        sessionStorage.removeItem("auth_token");
        router.replace("/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "تعذر تحميل المشاركات."
        );
      }

      setSubmissions(data.submissions || []);

    } catch (err) {
      console.error("Load Submissions Error:", err);

      setError(
        err.message || "حدث خطأ أثناء تحميل المشاركات."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getSubmissionType(type) {
    return Number(type) === 2 ? "فريق عمل" : "فردي";
  }

  return (
    <div dir="rtl" className="mx-auto max-w-7xl space-y-6">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="text-2xl font-bold text-[#163B63]">
            مشاركاتي
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            متابعة جميع مشاركاتك في مسابقة قصص النجاح والتميز
          </p>
        </div>

        <Link
          href="/employee/submissions/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#163B63] px-5 text-sm font-semibold text-white transition hover:bg-[#0D2B4B]"
        >
          <Plus size={19} />
          إضافة مشاركة جديدة
        </Link>

      </div>

      {/* Employee Information */}
      {employee && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#163B63]">
                <UserRound size={24} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  {employee.ename || "الموظف"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  الرقم الوظيفي: {employee.empn}
                </p>
              </div>

            </div>

            <div className="text-sm text-slate-500">
              {employee.edara_text || ""}
            </div>

          </div>

        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                إجمالي مشاركاتي
              </p>

              <p className="mt-2 text-3xl font-bold text-[#163B63]">
                {loading ? "..." : submissions.length}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#163B63]">
              <FileText size={24} />
            </div>

          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                إجمالي المرفقات
              </p>

              <p className="mt-2 text-3xl font-bold text-[#163B63]">
                {loading
                  ? "..."
                  : submissions.reduce(
                      (total, item) =>
                        total + (item.files?.length || 0),
                      0
                    )}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#163B63]">
              <Paperclip size={24} />
            </div>

          </div>
        </div>

      </div>

      {/* Submissions List */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">

          <div>
            <h2 className="font-bold text-[#163B63]">
              قائمة المشاركات
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              جميع المشاركات المسجلة برقمك الوظيفي
            </p>
          </div>

          <button
            type="button"
            onClick={loadSubmissions}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            تحديث
          </button>

        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <Loader2
              size={30}
              className="animate-spin text-[#163B63]"
            />

            <p className="text-sm text-slate-500">
              جاري تحميل المشاركات...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-6 text-center">

            <p className="text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={loadSubmissions}
              className="rounded-lg bg-[#163B63] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0D2B4B]"
            >
              إعادة المحاولة
            </button>

          </div>
        )}

        {/* Empty State */}
        {!loading && !error && submissions.length === 0 && (
          <div className="flex min-h-80 flex-col items-center justify-center px-5 py-12 text-center">

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-400">
              <Inbox size={38} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-700">
              لا توجد مشاركات حتى الآن
            </h3>

            <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
              لم تقم بتسجيل أي مشاركة في المسابقة حتى الآن.
              يمكنك البدء بإضافة قصة نجاح جديدة.
            </p>

            <Link
              href="/employee/submissions/new"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#163B63] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0D2B4B]"
            >
              <Plus size={18} />
              إضافة أول مشاركة
            </Link>

          </div>
        )}

        {/* Submissions Cards */}
        {!loading && !error && submissions.length > 0 && (
          <div className="divide-y divide-slate-100">

            {submissions.map((submission, index) => (
              <div
                key={submission.id}
                className="p-5 transition hover:bg-slate-50/70"
              >

                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

                  {/* Submission Details */}
                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#163B63]">
                        #{submission.id}
                      </span>

                      <span className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        تم التقديم
                      </span>

                    </div>

                    <h3 className="mt-3 text-base font-bold text-slate-800">
                      {submission.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">

                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={15} />
                        {formatDate(submission.created_at)}
                      </span>

                      <span className="flex items-center gap-1.5">
                        {Number(submission.submission_type) === 2 ? (
                          <Users size={15} />
                        ) : (
                          <UserRound size={15} />
                        )}

                        {getSubmissionType(submission.submission_type)}
                      </span>

                      {submission.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={15} />
                          {submission.location}
                        </span>
                      )}

                      <span className="flex items-center gap-1.5">
                        <Paperclip size={15} />
                        {submission.files?.length || 0} مرفق
                      </span>

                    </div>

                    {submission.criteria?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {submission.criteria.map((criterion, i) => (
                          <span
                            key={i}
                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"
                          >
                            {criterion.NameAr}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Action */}
                  <div className="flex shrink-0 justify-end">

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/employee/submissions/${submission.id}`
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-[#163B63] px-4 py-2.5 text-sm font-semibold text-[#163B63] transition hover:bg-blue-50"
                    >
                      عرض التفاصيل
                      <ArrowLeft size={16} />
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

    </div>
  );
}
