
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  LoaderCircle,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import FilePreviewModal from "@/components/submissions/FilePreviewModal";

const API_URL = "http://127.0.0.1:8000/api";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#163B63] focus:ring-2 focus:ring-[#163B63]/10";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

const emptyForm = {
  title: "",
  submissionType: "1",
  location: "",
  teamMembers: "",
  challenge: "",
  efforts: "",
  results: "",
  impact: "",
  inspiration: "",
};

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";

  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
}

function getErrorMessage(data, fallback) {
  if (data?.message) return data.message;

  if (data?.errors) {
    return Object.values(data.errors).flat().join("\n");
  }

  return fallback;
}

export default function EditSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.id;

  const [form, setForm] = useState(emptyForm);

  const [criteriaOptions, setCriteriaOptions] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState([]);

  const [existingFiles, setExistingFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  const [employee, setEmployee] = useState(null);
  const [deadline, setDeadline] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState(null);

  const [previewFile, setPreviewFile] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalFiles = existingFiles.length + newFiles.length;

  const formattedDeadline = useMemo(() => {
    if (!deadline) return "";

    const date = new Date(deadline);

    if (Number.isNaN(date.getTime())) return deadline;

    return date.toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [deadline]);

  const getToken = () => {
    if (typeof window === "undefined") return null;

    return sessionStorage.getItem("auth_token");
  };

  const handleUnauthorized = useCallback(() => {
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("employee");

    router.replace("/employee/login");
  }, [router]);

  // ------------------------------------------
  // Load Submission
  // ------------------------------------------

  const loadSubmission = useCallback(async () => {
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
        `${API_URL}/employee/submissions/${submissionId}/edit`,
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
          getErrorMessage(data, "تعذر تحميل بيانات المشاركة.")
        );
      }

      const submission = data.submission;

      setForm({
        title: submission.title || "",
        submissionType: String(submission.submission_type || "1"),
        location: submission.location || "",
        teamMembers: submission.team_members || "",
        challenge: submission.challenge || "",
        efforts: submission.efforts || "",
        results: submission.results || "",
        impact: submission.impact || "",
        inspiration: submission.inspiration || "",
      });

      setSelectedCriteria(
        (data.criteria || []).map(Number)
      );

      setCriteriaOptions(data.criteria_options || []);
      setFileTypes(data.file_types || []);
      setExistingFiles(data.files || []);
      setDeadline(data.deadline || null);

      const storedEmployee = sessionStorage.getItem("employee");

      if (storedEmployee) {
        setEmployee(JSON.parse(storedEmployee));
      }
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل المشاركة.");
    } finally {
      setLoading(false);
    }
  }, [submissionId, handleUnauthorized]);

  useEffect(() => {
    loadSubmission();
  }, [loadSubmission]);

  // ------------------------------------------
  // Form Changes
  // ------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const toggleCriterion = (criterionId) => {
    const id = Number(criterionId);

    setSelectedCriteria((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  // ------------------------------------------
  // Add New Files
  // ------------------------------------------

  const handleAddFiles = (event) => {
    const selected = Array.from(event.target.files || []);

    const allowedExtensions = [
      "pdf",
      "doc",
      "docx",
      "jpg",
      "jpeg",
      "png",
    ];

    const validFiles = [];
    const rejectedFiles = [];

    selected.forEach((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (!allowedExtensions.includes(extension)) {
        rejectedFiles.push(`${file.name}: نوع الملف غير مسموح`);
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        rejectedFiles.push(`${file.name}: الحد الأقصى 20 MB`);
        return;
      }

      validFiles.push({
        id: crypto.randomUUID(),
        file,
        fileTypeId: "",
      });
    });

    setError(
      rejectedFiles.length ? rejectedFiles.join("\n") : ""
    );

    setNewFiles((previous) => [...previous, ...validFiles]);

    event.target.value = "";
  };

  const updateNewFileType = (fileId, fileTypeId) => {
    setNewFiles((previous) =>
      previous.map((item) =>
        item.id === fileId
          ? { ...item, fileTypeId }
          : item
      )
    );
  };

  const removeNewFile = (fileId) => {
    setNewFiles((previous) =>
      previous.filter((item) => item.id !== fileId)
    );
  };

  // ------------------------------------------
  // Delete Existing Attachment
  // ------------------------------------------

  const handleDeleteExistingFile = async (file) => {
    const confirmed = window.confirm(
      `هل أنتِ متأكدة من حذف الملف "${file.OriginalFileName}"؟`
    );

    if (!confirmed) return;

    setDeletingFileId(file.Id);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `${API_URL}/employee/submission-files/${file.Id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          getErrorMessage(data, "تعذر حذف المرفق.")
        );
      }

      setExistingFiles((previous) =>
        previous.filter((item) => item.Id !== file.Id)
      );

      setSuccess("تم حذف المرفق بنجاح.");
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء حذف المرفق.");
    } finally {
      setDeletingFileId(null);
    }
  };

  // ------------------------------------------
  // Preview Existing Attachment
  // ------------------------------------------

  const handlePreview = async (file) => {
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
          getErrorMessage(data, "تعذر فتح الملف.")
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
    }
  };

  const closePreview = () => {
    if (previewFile?.url) {
      URL.revokeObjectURL(previewFile.url);
    }

    setPreviewFile(null);
  };

  // ------------------------------------------
  // Validation
  // ------------------------------------------

  const validateForm = () => {
    if (!form.title.trim()) {
      return "يرجى إدخال عنوان المشاركة.";
    }

    // الموقع اختياري
    if (!form.challenge.trim()) {
      return "يرجى إدخال التحدي أو المشكلة.";
    }

    if (!form.efforts.trim()) {
      return "يرجى إدخال الجهود المبذولة.";
    }

    if (!form.results.trim()) {
      return "يرجى إدخال النتائج المحققة.";
    }

    if (!form.impact.trim()) {
      return "يرجى إدخال الأثر والقيمة المضافة.";
    }

    if (selectedCriteria.length === 0) {
      return "يرجى اختيار معيار واحد على الأقل.";
    }

    if (
      form.submissionType === "2" &&
      !form.teamMembers.trim()
    ) {
      return "يرجى إدخال أسماء أعضاء الفريق.";
    }

    if (newFiles.some((item) => !item.fileTypeId)) {
      return "يرجى تحديد نوع كل مرفق جديد.";
    }

    // مسموح بحفظ المشاركة بدون أي مرفقات
    return null;
  };

  // ------------------------------------------
  // Save Changes
  // ------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);

    try {
      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("submission_type", form.submissionType);
      formData.append("location", form.location.trim());
      formData.append("team_members", form.teamMembers.trim());
      formData.append("challenge", form.challenge.trim());
      formData.append("efforts", form.efforts.trim());
      formData.append("results", form.results.trim());
      formData.append("impact", form.impact.trim());
      formData.append("inspiration", form.inspiration.trim());

      selectedCriteria.forEach((criterionId) => {
        formData.append("criteria[]", criterionId);
      });

      newFiles.forEach((item, index) => {
        formData.append(
          `files[${index}][file_type_id]`,
          item.fileTypeId
        );

        formData.append(
          `files[${index}][file]`,
          item.file
        );
      });

      // Laravel method spoofing for multipart update
      formData.append("_method", "PUT");

      const response = await fetch(
        `${API_URL}/employee/submissions/${submissionId}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          getErrorMessage(data, "تعذر تحديث المشاركة.")
        );
      }

      setSuccess(data.message || "تم تعديل المشاركة بنجاح.");

      setNewFiles([]);

      await loadSubmission();

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحديث المشاركة.");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------
  // Loading
  // ------------------------------------------

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <div className="flex items-center gap-3 text-[#163B63]">
          <LoaderCircle className="h-6 w-6 animate-spin" />

          <span className="text-sm font-semibold">
            جاري تحميل بيانات المشاركة...
          </span>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // Page UI
  // ------------------------------------------

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
            onClick={() =>
              router.push("/employee/submissions")
            }
            className="mb-3 flex items-center gap-2 text-sm text-slate-500 transition hover:text-[#163B63]"
          >
            <ArrowRight size={17} />

            العودة إلى مشاركاتي
          </button>

          <h1 className="text-2xl font-bold text-[#163B63]">
            تعديل المشاركة
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            يمكنك تعديل بيانات المشاركة وإدارة المرفقات قبل انتهاء فترة التقديم.
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-[#163B63]">
          رقم المشاركة: #{submissionId}
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="flex items-start gap-3 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <X className="mt-0.5 h-5 w-5 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* Success */}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={20} />

          <span>{success}</span>
        </div>
      )}

      {/* Deadline */}

      {formattedDeadline && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <CalendarDays size={20} />

          <span>
            آخر موعد للتعديل:{" "}
            <strong>{formattedDeadline}</strong>
          </span>
        </div>
      )}

      {/* Employee Information */}

      {employee && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-[#163B63]">
            بيانات مقدم المشاركة
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">الاسم</p>

              <p className="mt-1 font-semibold text-slate-700">
                {employee.ename || employee.name || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                الرقم الوظيفي
              </p>

              <p className="mt-1 font-semibold text-slate-700">
                {employee.empn || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">الإدارة</p>

              <p className="mt-1 font-semibold text-slate-700">
                {employee.edara_text || "-"}
              </p>
            </div>
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Information */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-xl bg-blue-50 p-2.5 text-[#163B63]">
              <FileText size={21} />
            </div>

            <div>
              <h2 className="font-bold text-[#163B63]">
                البيانات الأساسية
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                بيانات المشاركة ونوعها وموقع التنفيذ
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>
                عنوان المشاركة *
              </label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className={inputClass}
                placeholder="أدخل عنوان المشاركة"
              />
            </div>

            <div>
              <label className={labelClass}>
                نوع المشاركة *
              </label>

              <select
                name="submissionType"
                value={form.submissionType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="1">فردية</option>
                <option value="2">جماعية</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                موقع التنفيذ
              </label>

              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className={inputClass}
                placeholder="أدخل موقع التنفيذ (اختياري)"
              />
            </div>

            {form.submissionType === "2" && (
              <div className="md:col-span-2">
                <label className={labelClass}>
                  أسماء أعضاء الفريق *
                </label>

                <textarea
                  name="teamMembers"
                  value={form.teamMembers}
                  onChange={handleChange}
                  rows={3}
                  className={inputClass}
                  placeholder="أدخل أسماء أعضاء الفريق"
                />
              </div>
            )}
          </div>
        </section>

        {/* Submission Details */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="font-bold text-[#163B63]">
              تفاصيل المشاركة
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              حدّث تفاصيل التحدي والجهود والنتائج والأثر
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className={labelClass}>
                التحدي أو المشكلة *
              </label>

              <textarea
                name="challenge"
                value={form.challenge}
                onChange={handleChange}
                rows={4}
                className={inputClass}
                placeholder="اشرح التحدي أو المشكلة التي استدعت تنفيذ المشاركة..."
              />
            </div>

            <div>
              <label className={labelClass}>
                الجهود المبذولة *
              </label>

              <textarea
                name="efforts"
                value={form.efforts}
                onChange={handleChange}
                rows={4}
                className={inputClass}
                placeholder="اشرح الخطوات والجهود التي تم تنفيذها..."
              />
            </div>

            <div>
              <label className={labelClass}>
                النتائج المحققة *
              </label>

              <textarea
                name="results"
                value={form.results}
                onChange={handleChange}
                rows={4}
                className={inputClass}
                placeholder="اذكر النتائج التي تم تحقيقها..."
              />
            </div>

            <div>
              <label className={labelClass}>
                الأثر والقيمة المضافة *
              </label>

              <textarea
                name="impact"
                value={form.impact}
                onChange={handleChange}
                rows={4}
                className={inputClass}
                placeholder="ما الأثر الذي حققته المشاركة؟..."
              />
            </div>

            <div>
              <label className={labelClass}>
                مصدر الإلهام
              </label>

              <textarea
                name="inspiration"
                value={form.inspiration}
                onChange={handleChange}
                rows={3}
                className={inputClass}
                placeholder="هل توجد فكرة أو تجربة ألهمت هذه المشاركة؟"
              />
            </div>
          </div>
        </section>

        {/* Criteria */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <h2 className="font-bold text-[#163B63]">
              معايير المشاركة *
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              يمكنك تعديل المعايير المحددة
            </p>
          </div>

          {criteriaOptions.length === 0 ? (
            <p className="text-sm text-slate-400">
              لا توجد معايير متاحة حاليًا.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {criteriaOptions.map((criterion) => {
                const checked = selectedCriteria.includes(
                  Number(criterion.Id)
                );

                return (
                  <label
                    key={criterion.Id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                      checked
                        ? "border-[#163B63] bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleCriterion(criterion.Id)
                      }
                      className="h-4 w-4 accent-[#163B63]"
                    />

                    <span className="text-sm font-medium text-slate-700">
                      {criterion.NameAr}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {/* Existing Files */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-[#163B63]">
                المرفقات الحالية
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                يمكنك معاينة المرفقات أو حذفها
              </p>
            </div>

            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#163B63]">
              {existingFiles.length} مرفق
            </span>
          </div>

          {existingFiles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
              لا توجد مرفقات حالية.
            </div>
          ) : (
            <div className="space-y-3">
              {existingFiles.map((file) => (
                <div
                  key={file.Id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-slate-100 p-2.5 text-[#163B63]">
                      <FileText size={21} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {file.OriginalFileName}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {file.FileTypeName || "مرفق"} ·{" "}
                        {formatFileSize(file.FileSizeBytes)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreview(file)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#163B63] transition hover:bg-blue-50"
                    >
                      <Eye size={15} />
                      معاينة
                    </button>

                    <button
                      type="button"
                      disabled={deletingFileId === file.Id}
                      onClick={() =>
                        handleDeleteExistingFile(file)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingFileId === file.Id ? (
                        <LoaderCircle
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={15} />
                      )}

                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add New Files */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <h2 className="font-bold text-[#163B63]">
              إضافة مرفقات جديدة
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              PDF, DOC, DOCX, JPG, JPEG, PNG — بحد أقصى 20 MB للملف
            </p>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-[#163B63] hover:bg-blue-50/40">
            <div className="mb-3 rounded-full bg-blue-100 p-3 text-[#163B63]">
              <Upload size={23} />
            </div>

            <span className="text-sm font-bold text-[#163B63]">
              اضغطي لاختيار الملفات
            </span>

            <span className="mt-1 text-xs text-slate-400">
              يمكنك اختيار أكثر من ملف
            </span>

            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleAddFiles}
              className="hidden"
            />
          </label>

          {newFiles.length > 0 && (
            <div className="mt-5 space-y-3">
              {newFiles.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_220px_auto] sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText
                      className="shrink-0 text-[#163B63]"
                      size={21}
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {item.file.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                  </div>

                  <select
                    value={item.fileTypeId}
                    onChange={(event) =>
                      updateNewFileType(
                        item.id,
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="">
                      اختاري نوع المرفق *
                    </option>

                    {fileTypes.map((type) => (
                      <option key={type.Id} value={type.Id}>
                        {type.NameAr}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeNewFile(item.id)}
                    className="flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    إزالة
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Save Changes */}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-bold text-slate-700">
              إجمالي المرفقات: {totalFiles}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              يمكنك حفظ المشاركة بدون مرفقات
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/employee/submissions")
              }
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#163B63] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0D2B4B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}

              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </div>
      </form>

      {/* File Preview */}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={closePreview}
        />
      )}
    </div>
  );
}
