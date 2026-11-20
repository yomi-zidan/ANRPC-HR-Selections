
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Star,
  FileText,
  Download,
  Eye,
  RefreshCw,
  UserRound,
  Building2,
  CalendarDays,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("hr_token");
}

function StorySection({ title, children }) {
  return (
    <section className="rounded-2xl border border-[#D5DFEC] bg-white p-6 md:p-8">
      <h2 className="mb-5 text-xl font-bold text-[#102F5F]">
        {title}
      </h2>
      <div className="whitespace-pre-wrap leading-8 text-slate-700">
        {children || "لم يتم إدخال بيانات."}
      </div>
    </section>
  );
}

export default function HRSubmissionDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [submission, setSubmission] = useState(null);
  const [stars, setStars] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingFile, setOpeningFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSubmission = useCallback(async () => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/hr/submissions/${id}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("hr_token");
        sessionStorage.removeItem("hr_user");
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "تعذر تحميل تفاصيل المشاركة.");
      }

      setSubmission(result.submission);
      setStars(Number(result.submission.my_review?.Stars || 0));
      setNotes(result.submission.my_review?.Notes || "");
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل المشاركة.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    let active = true;

    async function fetchDetails() {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/hr/submissions/${id}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (response.status === 401) {
          sessionStorage.removeItem("hr_token");
          sessionStorage.removeItem("hr_user");
          router.replace("/login");
          return;
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || "تعذر تحميل تفاصيل المشاركة.");
        }

        if (active) {
          setSubmission(result.submission);
          setStars(Number(result.submission.my_review?.Stars || 0));
          setNotes(result.submission.my_review?.Notes || "");
        }
      } catch (err) {
        if (active) {
          setError(err.message || "حدث خطأ أثناء تحميل المشاركة.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDetails();

    return () => {
      active = false;
    };
  }, [id, router]);

  async function handleSaveEvaluation(e) {
    e.preventDefault();

    if (stars < 1 || stars > 5) {
      setError("اختاري التقييم من نجمة إلى خمس نجوم.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/hr/submissions/${id}/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            stars,
            notes,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("hr_token");
        sessionStorage.removeItem("hr_user");
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "تعذر حفظ التقييم.");
      }

      setMessage("تم حفظ التقييم بنجاح.");
      await loadSubmission();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء حفظ التقييم.");
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenFile(file) {
    try {
      setOpeningFile(file.id);
      setError("");

      const response = await fetch(file.url, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.status === 401) {
        sessionStorage.removeItem("hr_token");
        sessionStorage.removeItem("hr_user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "تعذر فتح المرفق.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const openedWindow = window.open(objectUrl, "_blank");

      if (!openedWindow) {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = file.name;
        link.click();
      }

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (err) {
      setError(err.message || "تعذر فتح المرفق.");
    } finally {
      setOpeningFile(null);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-[60vh] items-center justify-center bg-[#F2F4F8]"
      >
        <div className="flex items-center gap-3 text-[#163B63]">
          <RefreshCw size={22} className="animate-spin" />
          جاري تحميل تفاصيل المشاركة...
        </div>
      </main>
    );
  }

  if (error && !submission) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#F2F4F8] px-5 py-10 md:px-12"
      >
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={32} />
          <p className="mb-5 text-red-600">{error}</p>
          <button
            onClick={loadSubmission}
            className="rounded-xl bg-[#163B63] px-6 py-3 text-white"
          >
            إعادة المحاولة
          </button>
        </div>
      </main>
    );
  }

  if (!submission) return null;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F2F4F8] px-5 py-8 md:px-10"
    >
      <div className="mx-auto max-w-[1600px]">

        {/* Header */}
        <div className="mb-7">
          <Link
            href={`/hr/employees?department=${submission.department_id}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-[#163B63] hover:underline"
          >
            <ArrowRight size={17} />
            العودة إلى المشاركين
          </Link>

          <h1 className="text-2xl font-bold text-[#102F5F]">
            تفاصيل المشاركة والتقييم
          </h1>
        </div>

        {/* Employee and story information */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">

          <div className="space-y-6">

            {/* Submission information */}
            <section className="rounded-2xl border border-[#D5DFEC] bg-white p-6 md:p-8">
              <h2 className="mb-6 text-xl font-bold text-[#102F5F]">
                {submission.title}
              </h2>

              <div className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">

                <div className="flex items-center gap-3 text-slate-700">
                  <UserRound size={19} className="text-[#163B63]" />
                  <span>
                    <strong>اسم الموظف:</strong>{" "}
                    {submission.employee_name}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <span className="font-semibold text-[#163B63]">#</span>
                  <span>
                    <strong>الرقم الوظيفي:</strong>{" "}
                    {submission.empn}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Building2 size={19} className="text-[#163B63]" />
                  <span>
                    <strong>الإدارة:</strong>{" "}
                    {submission.department_name || "—"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <CalendarDays size={19} className="text-[#163B63]" />
                  <span>
                    <strong>تاريخ التقديم:</strong>{" "}
                    {submission.created_at
                      ? new Date(submission.created_at).toLocaleDateString("ar-EG")
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <FileText size={19} className="text-[#163B63]" />
                  <span>
                    <strong>نوع الترشيح:</strong>{" "}
                    {submission.submission_type_name}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <MapPin size={19} className="text-[#163B63]" />
                  <span>
                    <strong>الموقع:</strong>{" "}
                    {submission.location || "—"}
                  </span>
                </div>
              </div>

              {submission.team_members && (
                <div className="mt-5 border-t border-slate-100 pt-5 text-sm text-slate-700">
                  <strong>أعضاء الفريق:</strong>
                  <p className="mt-2 whitespace-pre-wrap">
                    {submission.team_members}
                  </p>
                </div>
              )}

              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="mb-3 font-bold text-[#102F5F]">
                  معايير المشاركة
                </h3>

                <div className="flex flex-wrap gap-2">
                  {submission.criteria?.length ? (
                    submission.criteria.map((criterion) => (
                      <span
                        key={criterion.Id}
                        className="rounded-full bg-[#EAF0F8] px-4 py-2 text-sm text-[#163B63]"
                      >
                        {criterion.NameAr}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">
                      لا توجد معايير مسجلة.
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Story sections */}
            <StorySection title="التحدي">
              {submission.challenge}
            </StorySection>

            <StorySection title="الجهود والحل">
              {submission.efforts}
            </StorySection>

            <StorySection title="النتائج بالأرقام">
              {submission.results}
            </StorySection>

            <StorySection title="الأثر">
              {submission.impact}
            </StorySection>

            <StorySection title="ملهمة للنشر">
              {submission.inspiration}
            </StorySection>

            {/* Attachments */}
            <section className="rounded-2xl border border-[#D5DFEC] bg-white p-6 md:p-8">
              <h2 className="mb-6 text-xl font-bold text-[#102F5F]">
                المرفقات
              </h2>

              {submission.files?.length ? (
                <div className="space-y-3">
                  {submission.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="shrink-0 text-[#163B63]" size={23} />

                        <div className="min-w-0">
                          <p className="break-all font-medium text-slate-700">
                            {file.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {file.type_name || "مرفق"}
                            {file.size
                              ? ` • ${(file.size / 1024 / 1024).toFixed(2)} MB`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenFile(file)}
                        disabled={openingFile === file.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#163B63] px-5 py-2.5 text-sm text-[#163B63] transition hover:bg-[#163B63] hover:text-white disabled:opacity-50"
                      >
                        {openingFile === file.id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Eye size={16} />
                        )}

                        معاينة
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-5 text-center text-slate-500">
                  لا توجد مرفقات.
                </p>
              )}
            </section>
          </div>

          {/* Evaluation Panel */}
          <aside className="lg:sticky lg:top-6">
            <form
              onSubmit={handleSaveEvaluation}
              className="rounded-2xl border border-[#D5DFEC] bg-white p-6 md:p-7"
            >
              <h2 className="mb-7 text-xl font-bold text-[#102F5F]">
                تقييم المشاركة
              </h2>

              <p className="mb-4 text-sm text-slate-600">
                اختاري التقييم من نجمة إلى خمس نجوم
              </p>

              <div className="mb-8 flex items-center justify-center gap-2" dir="ltr">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStars(value)}
                    aria-label={`تقييم ${value} من 5`}
                    className="rounded-md p-1 transition hover:scale-110"
                  >
                    <Star
                      size={35}
                      strokeWidth={1.8}
                      className={
                        value <= stars
                          ? "fill-amber-500 text-amber-600"
                          : "text-amber-600"
                      }
                    />
                  </button>
                ))}
              </div>

              <div className="mb-6 text-center text-sm font-semibold text-amber-700">
                {stars > 0 ? `${stars} من 5 نجوم` : "لم يتم اختيار تقييم"}
              </div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                ملاحظات التقييم
              </label>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                maxLength={4000}
                placeholder="اكتبي ملاحظاتك حول المشاركة..."
                className="w-full resize-y rounded-xl border border-[#C9D4E3] p-3 text-sm outline-none transition focus:border-[#163B63] focus:ring-2 focus:ring-[#163B63]/10"
              />

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {message && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle2 size={17} />
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || stars === 0}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#102F5F] font-semibold text-white transition hover:bg-[#0B2449] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    جاري حفظ التقييم...
                  </>
                ) : (
                  "حفظ التقييم"
                )}
              </button>

              {submission.my_review && (
                <p className="mt-4 text-center text-xs text-slate-500">
                  يمكنك تعديل تقييمك وحفظه مرة أخرى.
                </p>
              )}
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}
