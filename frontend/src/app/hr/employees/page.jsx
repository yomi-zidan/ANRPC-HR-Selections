
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  FileText,
  Eye,
  RefreshCw,
  AlertCircle,
  UserRound,
} from "lucide-react";

import { getDepartmentParticipants } from "@/services/hrService";

export default function HREmployeesPage() {
  const searchParams = useSearchParams();
  const departmentId = searchParams.get("department");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadParticipants = useCallback(async () => {
    if (!departmentId) {
      setError("لم يتم تحديد الإدارة.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getDepartmentParticipants(departmentId);
      setData(result);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل المشاركين.");
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    let active = true;

    if (!departmentId) {
      setError("لم يتم تحديد الإدارة.");
      setLoading(false);
      return;
    }

    getDepartmentParticipants(departmentId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "حدث خطأ أثناء تحميل المشاركين.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [departmentId]);

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-[60vh] items-center justify-center bg-[#F2F4F8]"
      >
        <div className="flex items-center gap-3 text-[#163B63]">
          <RefreshCw size={22} className="animate-spin" />
          جاري تحميل المشاركين...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#F2F4F8] px-5 py-10 md:px-12"
      >
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={32} />
          <p className="mb-5 text-red-600">{error}</p>

          <button
            onClick={loadParticipants}
            className="rounded-xl bg-[#163B63] px-6 py-3 text-white hover:bg-[#0D2B4B]"
          >
            إعادة المحاولة
          </button>
        </div>
      </main>
    );
  }

  const participants = data?.participants || [];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F2F4F8] px-5 py-10 md:px-12"
    >
      <div className="mx-auto max-w-[1600px]">

        {/* Page Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>
            <Link
              href="/hr/dashboard"
              className="mb-4 inline-flex items-center gap-2 text-sm text-[#163B63] hover:underline"
            >
              <ArrowRight size={17} />
              العودة إلى لوحة الإدارات
            </Link>

            <h1 className="text-2xl font-bold text-[#102F5F]">
              {data?.department?.name || "المشاركون"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              الموظفون الذين قاموا بتقديم مشاركات في هذه الإدارة
            </p>
          </div>

          <button
            onClick={loadParticipants}
            className="flex items-center gap-2 rounded-xl border border-[#D5DFEC] bg-white px-5 py-3 text-sm text-[#163B63] hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            تحديث البيانات
          </button>
        </div>

        {/* Participants Count */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#D5DFEC] bg-white p-6">
            <div className="mb-3 flex items-center gap-3 text-slate-600">
              <Users size={21} className="text-[#163B63]" />
              عدد الموظفين المشاركين
            </div>

            <p className="text-4xl font-bold text-[#142844]">
              {data?.total || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D5DFEC] bg-white p-6">
            <div className="mb-3 flex items-center gap-3 text-slate-600">
              <FileText size={21} className="text-[#163B63]" />
              إجمالي المشاركات
            </div>

            <p className="text-4xl font-bold text-[#142844]">
              {participants.reduce(
                (sum, employee) =>
                  sum + Number(employee.submissions_count || 0),
                0
              )}
            </p>
          </div>
        </div>

        {/* Participants Table */}
        <section className="rounded-2xl border border-[#D5DFEC] bg-white p-6 md:p-9">

          <h2 className="mb-7 text-xl font-bold text-[#102F5F]">
            الموظفون المشاركون
          </h2>

          {participants.length === 0 ? (
            <div className="py-16 text-center">
              <Users
                size={42}
                className="mx-auto mb-4 text-slate-300"
              />

              <p className="font-medium text-slate-600">
                لا يوجد موظفون قدموا مشاركات في هذه الإدارة حتى الآن.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[750px] text-right">

                <thead>
                  <tr className="border-b-2 border-[#D5DFEC] text-[#142844]">
                    <th className="pb-5">اسم الموظف</th>
                    <th className="pb-5 text-center">الرقم الوظيفي</th>
                    <th className="pb-5 text-center">عدد المشاركات</th>
                    <th className="pb-5 text-left">المشاركات</th>
                  </tr>
                </thead>

                <tbody>
                  {participants.map((employee) => (
                    <tr
                      key={employee.empn}
                      className="border-b border-[#E5EAF1] last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF0F8] text-[#163B63]">
                            <UserRound size={20} />
                          </div>

                          <span className="font-semibold text-slate-700">
                            {employee.employee_name}
                          </span>
                        </div>
                      </td>

                      <td className="py-5 text-center text-slate-600" dir="ltr">
                        {employee.empn}
                      </td>

                      <td className="py-5 text-center font-semibold text-slate-700">
                        {employee.submissions_count}
                      </td>

                      <td className="py-4 text-left">
                        <div className="flex flex-col items-end gap-2">
                          {employee.submissions.map((submission) => (
                            <Link
                              key={submission.id}
                              href={`/hr/submissions/${submission.id}`}
                              className="inline-flex w-full max-w-[260px] items-center justify-between gap-3 rounded-lg border border-[#163B63] px-4 py-2.5 text-sm text-[#163B63] transition hover:bg-[#163B63] hover:text-white"
                            >
                              <span className="truncate">
                                {submission.title}
                              </span>

                              <Eye size={17} className="shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
