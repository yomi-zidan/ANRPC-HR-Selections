
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Edit3,
  Eye,
  FileText,
  LoaderCircle,
  MapPin,
  Users,
  X,
} from "lucide-react";

import FilePreviewModal from "@/components/submissions/FilePreviewModal";

const API_URL = "http://127.0.0.1:8000/api";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";

  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
}

function InfoCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
        {Icon && <Icon size={15} />}
        {label}
      </div>

      <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-7 text-slate-700">
        {value || "غير محدد"}
      </p>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="mb-5 border-b border-slate-100 pb-4 text-base font-bold text-[#163B63]">
        {title}
      </h2>

      {children}
    </section>
  );
}

export default function SubmissionDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const submissionId = params?.id;

  const [submission, setSubmission] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [files, setFiles] = useState([]);
  const [deadline, setDeadline] = useState(null);
  const [editable, setEditable] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoadingId, setPreviewLoadingId] = useState(null);

  const formattedDeadline = useMemo(
    () => formatDate(deadline),
    [deadline]
  );

  const getToken = () => {
    if (typeof window === "undefined") return null;

    return sessionStorage.getItem("auth_token");
  };

  const handleUnauthorized = useCallback(() => {
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("employee");

    router.replace("/employee/login");
  }, [router]);

  const loadDetails = useCallback(async () => {
    if (!submissionId) return;

    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `${API_URL}/employee/submissions/${submissionId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "تعذر تحميل تفاصيل المشاركة."
        );
      }

      setSubmission(data.submission);
      setEmployee(data.employee);
      setCriteria(data.criteria || []);
      setFiles(data.files || []);
      setDeadline(data.deadline || null);
      setEditable(Boolean(data.editable));
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل التفاصيل.");
    } finally {
      setLoading(false);
    }
  }, [submissionId, handleUnauthorized]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handlePreview = async (file) => {
    setPreviewLoadingId(file.Id);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `${API_URL}/employee/submission-files/${file.Id}/preview`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data.message || "تعذر فتح المرفق."
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setPreviewFile({
        id: file.Id,
        name: file.OriginalFileName,
        blob,
        url,
      });
    } catch (err) {
      setError(err.message || "تعذر معاينة الملف.");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const closePreview = () => {
    if (previewFile?.url) {
      URL.revokeObjectURL(previewFile.url);
    }

    setPreviewFile(null);
  };

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <div className="flex items-center gap-3 text-[#163B63]">
          <LoaderCircle size={25} className="animate-spin" />

          <span className="text-sm font-semibold">
            جاري تحميل تفاصيل المشاركة...
          </span>
        </div>
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div
        dir="rtl"
        className="mx-auto max-w-4xl px-4 py-12"
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <X className="mx-auto mb-3 text-red-500" size={30} />

          <p className="text-sm font-semibold text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => router.push("/employee/submissions")}
            className="mt-5 rounded-xl bg-[#163B63] px-5 py-3 text-sm font-semibold text-white"
          >
            العودة إلى مشاركاتي
          </button>
        </div>
      </div>
    );
  }

  if (!submission) return null;

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-5xl space-y-6 pb-12"
    >
      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push("/employee/submissions")}
            className="mb-3 flex items-center gap-2 text-sm text-slate-500 transition hover:text-[#163B63]"
          >
            <ArrowRight size={17} />
            العودة إلى مشاركاتي
          </button>

          <h1 className="text-2xl font-bold text-[#163B63]">
            تفاصيل المشاركة
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            عرض جميع بيانات المشاركة والمرفقات الخاصة بها.
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-[#163B63]">
          رقم المشاركة: #{submission.id}
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <X size={19} />
          {error}
        </div>
      )}

      {/* Status and Actions */}

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            {editable ? (
              <>
                <CheckCircle2 className="text-green-600" size={19} />
                <span className="text-sm font-bold text-green-700">
                  التعديل متاح
                </span>
              </>
            ) : (
              <>
                <Clock3 className="text-amber-600" size={19} />
                <span className="text-sm font-bold text-amber-700">
                  انتهت فترة التعديل أو لا توجد مسابقة نشطة
                </span>
              </>
            )}
          </div>

          {deadline && (
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <CalendarDays size={14} />
              آخر موعد للتعديل: {formattedDeadline}
            </p>
          )}
        </div>

        {editable && (
          <button
            type="button"
            onClick={() =>
              router.push(
                `/employee/submissions/${submission.id}/edit`
              )
            }
            className="flex items-center gap-2 rounded-xl bg-[#163B63] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0D2B4B]"
          >
            <Edit3 size={17} />
            تعديل المشاركة
          </button>
        )}
      </section>

      {/* Employee Information */}

      <DetailSection title="بيانات مقدم المشاركة">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard
            label="الاسم"
            value={employee?.ename}
          />

          <InfoCard
            label="الرقم الوظيفي"
            value={employee?.empn}
          />

          <InfoCard
            label="الإدارة"
            value={employee?.edara_text}
          />

          <InfoCard
            label="الكود الوظيفي"
            value={employee?.code_wazifa}
          />
        </div>
      </DetailSection>

      {/* Basic Information */}

      <DetailSection title="البيانات الأساسية للمشاركة">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard
            label="عنوان المشاركة"
            value={submission.title}
            icon={FileText}
          />

          <InfoCard
            label="نوع المشاركة"
            value={
              Number(submission.submission_type) === 1
                ? "مشاركة فردية"
                : "مشاركة جماعية"
            }
            icon={Users}
          />

          <InfoCard
            label="موقع التنفيذ"
            value={submission.location}
            icon={MapPin}
          />

          {Number(submission.submission_type) === 2 && (
            <div className="sm:col-span-2">
              <InfoCard
                label="أعضاء الفريق"
                value={submission.team_members}
                icon={Users}
              />
            </div>
          )}
        </div>
      </DetailSection>

      {/* Submission Details */}

      <DetailSection title="تفاصيل المشاركة">
        <div className="space-y-5">
          <InfoCard
            label="التحدي أو المشكلة"
            value={submission.challenge}
          />

          <InfoCard
            label="الجهود المبذولة"
            value={submission.efforts}
          />

          <InfoCard
            label="النتائج المحققة"
            value={submission.results}
          />

          <InfoCard
            label="الأثر والقيمة المضافة"
            value={submission.impact}
          />

          <InfoCard
            label="مصدر الإلهام"
            value={submission.inspiration}
          />
        </div>
      </DetailSection>

      {/* Criteria */}

      <DetailSection title="معايير المشاركة">
        {criteria.length === 0 ? (
          <p className="text-sm text-slate-400">
            لا توجد معايير مسجلة.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {criteria.map((item) => (
              <div
                key={item.Id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <CheckCircle2
                  size={19}
                  className="shrink-0 text-green-600"
                />

                <span className="text-sm font-semibold text-slate-700">
                  {item.NameAr}
                </span>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      {/* Attachments */}

      <DetailSection title="المرفقات">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            الملفات المرفقة بالمشاركة
          </p>

          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#163B63]">
            {files.length} مرفق
          </span>
        </div>

        {files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <FileText
              size={30}
              className="mx-auto mb-3 text-slate-300"
            />

            <p className="text-sm text-slate-400">
              لا توجد مرفقات لهذه المشاركة.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.Id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5 text-[#163B63]">
                    <FileText size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {file.OriginalFileName}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {file.FileTypeName || "مرفق"} ·{" "}
                      {formatFileSize(file.FileSizeBytes)}
                    </p>

                    {file.UploadedAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        تاريخ الرفع: {formatDate(file.UploadedAt)}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={previewLoadingId === file.Id}
                  onClick={() => handlePreview(file)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-[#163B63] transition hover:bg-blue-50 disabled:opacity-50"
                >
                  {previewLoadingId === file.Id ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Eye size={16} />
                  )}

                  معاينة الملف
                </button>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      {/* Submission Dates */}

      <DetailSection title="تواريخ المشاركة">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard
            label="تاريخ تقديم المشاركة"
            value={formatDate(submission.created_at)}
            icon={CalendarDays}
          />

          <InfoCard
            label="آخر تحديث"
            value={formatDate(submission.updated_at)}
            icon={Clock3}
          />
        </div>
      </DetailSection>

      {/* Bottom Actions */}

      <div className="flex flex-wrap justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => router.push("/employee/submissions")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowRight size={17} />
          العودة إلى مشاركاتي
        </button>

        {editable && (
          <button
            type="button"
            onClick={() =>
              router.push(
                `/employee/submissions/${submission.id}/edit`
              )
            }
            className="flex items-center gap-2 rounded-xl bg-[#163B63] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0D2B4B]"
          >
            <Edit3 size={17} />
            تعديل المشاركة
          </button>
        )}
      </div>

      {/* Preview Modal */}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={closePreview}
        />
      )}
    </div>
  );
}
