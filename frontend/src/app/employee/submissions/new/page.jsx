
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Upload,
  Trash2,
  Save,
  FileText,
  LoaderCircle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function NewSubmission() {
  const router = useRouter();

  const [employee, setEmployee] = useState(null);
  const [criteriaOptions, setCriteriaOptions] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [contest, setContest] = useState(null);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const [submissionType, setSubmissionType] = useState("1");
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [teamMembers, setTeamMembers] = useState("");
  const [files, setFiles] = useState([]);

  const [form, setForm] = useState({
    location: "",
    title: "",
    challenge: "",
    efforts: "",
    results: "",
    impact: "",
    inspiration: "",
  });

  const inputClass =
    "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#163B63] focus:ring-1 focus:ring-[#163B63]";

  const textareaClass =
    "min-h-24 w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-[#163B63] focus:ring-1 focus:ring-[#163B63]";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-600";

  // Load employee and form options
  useEffect(() => {
    const savedEmployee = sessionStorage.getItem("employee");
    const token = sessionStorage.getItem("auth_token");

    if (!savedEmployee || !token) {
      router.replace("/login");
      return;
    }

    try {
      setEmployee(JSON.parse(savedEmployee));
    } catch {
      sessionStorage.removeItem("employee");
      sessionStorage.removeItem("auth_token");
      router.replace("/login");
      return;
    }

    loadOptions(token);
  }, [router]);

  async function loadOptions(token) {
    try {
      setLoadingOptions(true);

      const response = await fetch(
        `${API_URL}/employee/submission-options`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("employee");
        sessionStorage.removeItem("auth_token");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "تعذر تحميل بيانات النموذج.");
      }

      setCriteriaOptions(data.criteria || []);
      setFileTypes(data.file_types || []);
      setContest(data.contest || null);

    } catch (error) {
      setMessage(error.message || "حدث خطأ أثناء تحميل البيانات.");
      setMessageType("error");
    } finally {
      setLoadingOptions(false);
    }
  }

  function updateField(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function toggleCriteria(id) {
    setSelectedCriteria((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function addFiles(e) {
    const selected = Array.from(e.target.files || []);
    const allowedExtensions = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;

    const validFiles = selected.filter((file) =>
      allowedExtensions.test(file.name)
    );

    const invalidCount = selected.length - validFiles.length;

    const newFiles = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      fileTypeId: fileTypes[0]?.Id
        ? String(fileTypes[0].Id)
        : "",
    }));

    setFiles((previous) => [...previous, ...newFiles]);

    if (invalidCount > 0) {
      setMessage(
        "تم تجاهل بعض الملفات. المسموح PDF وWord والصور فقط."
      );
      setMessageType("error");
    } else {
      setMessage("");
    }

    e.target.value = "";
  }

  function updateFileType(id, value) {
    setFiles((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, fileTypeId: value }
          : item
      )
    );
  }

  function removeFile(id) {
    setFiles((previous) =>
      previous.filter((item) => item.id !== id)
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");

    const token = sessionStorage.getItem("auth_token");

    if (!token) {
      setMessage("انتهت جلسة الدخول. برجاء تسجيل الدخول مرة أخرى.");
      setMessageType("error");
      return;
    }

    if (selectedCriteria.length === 0) {
      setMessage("برجاء اختيار معيار ترشيح واحد على الأقل.");
      setMessageType("error");
      return;
    }

    if (submissionType === "2" && !teamMembers.trim()) {
      setMessage("برجاء إدخال أسماء أعضاء الفريق ومسمياتهم.");
      setMessageType("error");
      return;
    }

    if (files.length === 0) {
      setMessage("برجاء إرفاق ملف واحد على الأقل.");
      setMessageType("error");
      return;
    }

    if (files.some((item) => !item.fileTypeId)) {
      setMessage("برجاء اختيار نوع كل مرفق.");
      setMessageType("error");
      return;
    }

    const formData = new FormData();

    formData.append("title", form.title);
    formData.append("submission_type", submissionType);
    formData.append("location", form.location);
    formData.append("team_members", teamMembers);

    formData.append("challenge", form.challenge);
    formData.append("efforts", form.efforts);
    formData.append("results", form.results);
    formData.append("impact", form.impact);
    formData.append("inspiration", form.inspiration);

    selectedCriteria.forEach((id) => {
      formData.append("criteria[]", String(id));
    });

    files.forEach((item, index) => {
      formData.append(
        `files[${index}][file_type_id]`,
        String(item.fileTypeId)
      );

      formData.append(
        `files[${index}][file]`,
        item.file
      );
    });

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/employee/submissions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("employee");
        sessionStorage.removeItem("auth_token");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const validationErrors = data.errors
          ? Object.values(data.errors).flat().join(" ")
          : data.message;

        throw new Error(
          validationErrors || "تعذر حفظ المشاركة."
        );
      }

      setMessage(data.message || "تم حفظ المشاركة بنجاح.");
      setMessageType("success");

      setTimeout(() => {
        router.push("/employee/submissions");
      }, 1200);

    } catch (error) {
      setMessage(error.message || "حدث خطأ أثناء حفظ المشاركة.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingOptions && !employee) {
    return null;
  }

  return (
    <div dir="rtl" className="mx-auto max-w-6xl space-y-6">

      {/* Page heading */}
      <div className="flex items-center gap-3">
        <Link
          href="/employee/submissions"
          className="rounded-lg border border-slate-200 bg-white p-2 text-[#163B63] hover:bg-slate-50"
        >
          <ArrowRight size={20} />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-[#163B63]">
            إضافة مشاركة جديدة
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            نموذج المشاركة في قصص النجاح والتميز
          </p>
        </div>
      </div>

      {contest && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-[#163B63]">
          <p className="font-bold">{contest.ContestName}</p>
          <p className="mt-1">
            آخر موعد للتقديم:{" "}
            {new Date(contest.DeadlineDate).toLocaleDateString("ar-EG")}
          </p>
        </div>
      )}

      {loadingOptions && (
        <div className="flex items-center gap-2 rounded-lg bg-white p-4 text-sm text-slate-600">
          <LoaderCircle className="animate-spin" size={18} />
          جاري تحميل معايير الترشيح وأنواع المرفقات...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Participant information */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-6 text-lg font-bold text-[#163B63]">
            بيانات المشارك
          </h2>

          <div className="mb-5">
            <label className={labelClass}>رقم القيد</label>
            <input
              value={employee?.empn || ""}
              readOnly
              className={`${inputClass} bg-slate-100`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>الاسم</label>
              <input
                value={employee?.ename || ""}
                readOnly
                className={`${inputClass} bg-slate-100`}
              />
            </div>

            <div>
              <label className={labelClass}>المسمى الوظيفي</label>
              <input
                value={employee?.nwazifa || employee?.code_wazifa || ""}
                readOnly
                className={`${inputClass} bg-slate-100`}
              />
            </div>

            <div>
              <label className={labelClass}>الإدارة</label>
              <input
                value={employee?.edara_text || ""}
                readOnly
                className={`${inputClass} bg-slate-100`}
              />
            </div>
          </div>

          <div className="mt-5">
            <label className={labelClass}>
              الموقع (مكتب / موقع تشغيلي)
            </label>
            <input
              name="location"
              value={form.location}
              onChange={updateField}
              placeholder="أدخل الموقع"
              className={inputClass}
            />
          </div>

          <div className="mt-6">
            <div className="mb-4 flex flex-wrap items-center gap-6">
              <span className="text-sm font-bold text-[#163B63]">
                نوع الترشيح:
              </span>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="radio"
                  name="submissionType"
                  value="1"
                  checked={submissionType === "1"}
                  onChange={() => setSubmissionType("1")}
                  className="accent-[#163B63]"
                />
                فردي
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="radio"
                  name="submissionType"
                  value="2"
                  checked={submissionType === "2"}
                  onChange={() => setSubmissionType("2")}
                  className="accent-[#163B63]"
                />
                فريق عمل
              </label>
            </div>

            {submissionType === "2" && (
              <div>
                <label className={labelClass}>
                  أعضاء الفريق ومسمياتهم
                </label>
                <textarea
                  value={teamMembers}
                  onChange={(e) => setTeamMembers(e.target.value)}
                  placeholder="أدخل أسماء أعضاء الفريق ومسمياتهم..."
                  className={textareaClass}
                />
              </div>
            )}
          </div>
        </section>

        {/* Criteria */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-6 text-lg font-bold text-[#163B63]">
            معايير الترشيح
          </h2>

          {criteriaOptions.length === 0 && !loadingOptions ? (
            <p className="text-sm text-slate-500">
              لا توجد معايير نشطة في إعدادات المسابقة.
            </p>
          ) : (
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {criteriaOptions.map((criterion) => (
                <label
                  key={criterion.Id}
                  className="flex cursor-pointer items-center gap-3 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedCriteria.includes(criterion.Id)}
                    onChange={() => toggleCriteria(criterion.Id)}
                    className="h-4 w-4 accent-[#163B63]"
                  />
                  {criterion.NameAr}
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Success story */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-6 text-lg font-bold text-[#163B63]">
            قصة النجاح
          </h2>

          <div className="space-y-5">
            <div>
              <label className={labelClass}>عنوان القصة</label>
              <input
                name="title"
                value={form.title}
                onChange={updateField}
                required
                maxLength={300}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>طبيعة التحدي</label>
              <textarea
                name="challenge"
                value={form.challenge}
                onChange={updateField}
                required
                className={textareaClass}
              />
            </div>

            <div>
              <label className={labelClass}>الجهود والحل المطبق</label>
              <textarea
                name="efforts"
                value={form.efforts}
                onChange={updateField}
                required
                className={textareaClass}
              />
            </div>

            <div>
              <label className={labelClass}>النتائج بالأرقام</label>
              <textarea
                name="results"
                value={form.results}
                onChange={updateField}
                required
                className={textareaClass}
              />
            </div>

            <div>
              <label className={labelClass}>الأثر</label>
              <textarea
                name="impact"
                value={form.impact}
                onChange={updateField}
                required
                className={textareaClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                ما يجعلها ملهمة للنشر
              </label>
              <textarea
                name="inspiration"
                value={form.inspiration}
                onChange={updateField}
                className={textareaClass}
              />
            </div>
          </div>
        </section>

        {/* Attachments */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-6 text-lg font-bold text-[#163B63]">
            المرفقات (أكثر من ملف)
          </h2>

          {files.length > 0 && (
            <div className="mb-4 space-y-3">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="grid items-center gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_220px_90px]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText
                      className="shrink-0 text-[#163B63]"
                      size={20}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(item.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <select
                    value={item.fileTypeId}
                    onChange={(e) =>
                      updateFileType(item.id, e.target.value)
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">اختر نوع المرفق</option>
                    {fileTypes.map((type) => (
                      <option key={type.Id} value={type.Id}>
                        {type.NameAr}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    className="rounded-md border border-[#163B63] px-3 py-2 text-sm text-[#163B63] hover:bg-blue-50"
                  >
                    <Trash2 size={16} className="mx-auto" />
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#163B63] px-5 py-7 text-center text-[#163B63] transition hover:bg-blue-50">
            <Upload size={26} />
            <span className="mt-3 text-sm font-semibold">
              + إضافة ملفات متعددة
            </span>
            <span className="mt-2 text-xs text-slate-500">
              PDF أو Word أو صور (JPG, PNG)
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={addFiles}
              className="hidden"
            />
          </label>

          <p className="mt-3 text-xs text-slate-500">
            الحد الأقصى لحجم الملف الواحد 20 ميجابايت.
          </p>
        </section>

        {/* Messages */}
        {message && (
          <div
            className={`rounded-lg border p-4 text-sm ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-3">
          <Link
            href="/employee/submissions"
            className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            إلغاء
          </Link>

          <button
            type="submit"
            disabled={submitting || loadingOptions}
            className="inline-flex min-w-40 items-center justify-center gap-2 rounded-lg bg-[#163B63] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#0D2B4B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save size={18} />
                حفظ المشاركة
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
