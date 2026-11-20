"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Save, Upload, Trash2, FileText, AlertTriangle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const inputClass = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#163B63] focus:ring-1 focus:ring-[#163B63]";
const textareaClass = "min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-[#163B63] focus:ring-1 focus:ring-[#163B63]";
const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

export default function EditSubmissionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [submission, setSubmission] = useState(null);
  const [criteriaOptions, setCriteriaOptions] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [form, setForm] = useState({
    title: "", submission_type: "1", location: "", team_members: "",
    challenge: "", efforts: "", results: "", impact: "", inspiration: "",
  });

  const loadData = useCallback(async () => {
    const token = sessionStorage.getItem("auth_token");
    if (!token) { router.replace("/login"); return; }
    try {
      setLoading(true);
      const [detailsResponse, optionsResponse] = await Promise.all([
        fetch(`${API_URL}/employee/submissions/${id}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" }),
        fetch(`${API_URL}/employee/submission-options`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" }),
      ]);
      if (detailsResponse.status === 401 || optionsResponse.status === 401) {
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("employee");
        router.replace("/login");
        return;
      }
      const details = await detailsResponse.json();
      const options = await optionsResponse.json();
      if (!detailsResponse.ok || !details.success) throw new Error(details.message || "تعذر تحميل المشاركة.");
      if (!optionsResponse.ok || !options.success) throw new Error(options.message || "تعذر تحميل خيارات النموذج.");
      setSubmission(details.submission);
      setCriteriaOptions(options.criteria || []);
      setFileTypes(options.file_types || []);
      setSelectedCriteria((details.submission.criteria || []).map((item) => Number(item.Id)));
      setForm({
        title: details.submission.title || "",
        submission_type: String(details.submission.submission_type || 1),
        location: details.submission.location || "",
        team_members: details.submission.team_members || "",
        challenge: details.submission.challenge || "",
        efforts: details.submission.efforts || "",
        results: details.submission.results || "",
        impact: details.submission.impact || "",
        inspiration: details.submission.inspiration || "",
      });
      if (!details.edit_allowed) {
        setMessage("انتهى الموعد النهائي للتعديل. يمكنك عرض المشاركة فقط.");
        setMessageType("warning");
      }
    } catch (error) {
      setMessage(error.message || "حدث خطأ أثناء تحميل المشاركة.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { loadData(); }, [loadData]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleCriterion(criterionId) {
    setSelectedCriteria((current) => current.includes(criterionId)
      ? current.filter((item) => item !== criterionId)
      : [...current, criterionId]);
  }

  function addFiles(event) {
    const selected = Array.from(event.target.files || []);
    const allowed = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;
    const valid = selected.filter((file) => allowed.test(file.name));
    const mapped = valid.map((file) => ({
      id: crypto.randomUUID(),
      file,
      fileTypeId: fileTypes[0]?.Id ? String(fileTypes[0].Id) : "",
    }));
    setNewFiles((current) => [...current, ...mapped]);
    if (valid.length !== selected.length) {
      setMessage("تم تجاهل الملفات غير المدعومة. المسموح PDF وWord والصور.");
      setMessageType("warning");
    } else {
      setMessage("");
    }
    event.target.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    const token = sessionStorage.getItem("auth_token");
    if (!token) { router.replace("/login"); return; }
    if (!selectedCriteria.length) {
      setMessage("برجاء اختيار معيار واحد على الأقل."); setMessageType("error"); return;
    }
    if (form.submission_type === "2" && !form.team_members.trim()) {
      setMessage("برجاء إدخال أسماء أعضاء الفريق."); setMessageType("error"); return;
    }
    if (newFiles.some((item) => !item.fileTypeId)) {
      setMessage("برجاء تحديد نوع كل مرفق جديد."); setMessageType("error"); return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    selectedCriteria.forEach((criterionId) => payload.append("criteria[]", String(criterionId)));
    newFiles.forEach((item, index) => {
      payload.append(`files[${index}][file_type_id]`, String(item.fileTypeId));
      payload.append(`files[${index}][file]`, item.file);
    });

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/employee/submissions/${id}/update`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: payload,
      });
      const result = await response.json();
      if (response.status === 401) {
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("employee");
        router.replace("/login");
        return;
      }
      if (!response.ok || !result.success) {
        const validation = result.errors ? Object.values(result.errors).flat().join(" ") : result.message;
        throw new Error(validation || "تعذر تحديث المشاركة.");
      }
      setMessage(result.message || "تم تحديث المشاركة بنجاح.");
      setMessageType("success");
      setTimeout(() => router.push("/employee/submissions"), 900);
    } catch (error) {
      setMessage(error.message || "حدث خطأ أثناء تحديث المشاركة.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center gap-3 text-[#163B63]" dir="rtl"><Loader2 className="animate-spin" /> جاري تحميل بيانات المشاركة...</div>;
  if (!submission) return <div className="mx-auto max-w-3xl p-8 text-center text-red-600" dir="rtl">{message || "تعذر العثور على المشاركة."}</div>;

  const editAllowed = messageType !== "warning";

  return (
    <main dir="rtl" className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employee/submissions" className="rounded-lg border border-slate-200 bg-white p-2 text-[#163B63] hover:bg-slate-50"><ArrowRight size={20} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-[#163B63]">تعديل المشاركة #{submission.id}</h1>
          <p className="mt-1 text-sm text-slate-500">يمكنك تحديث البيانات وإضافة مرفقات جديدة قبل الموعد النهائي.</p>
        </div>
      </div>

      {submission.files?.length > 0 && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold text-[#163B63]">المرفقات الحالية</h2>
        <p className="mb-3 text-xs text-slate-500">المرفقات الحالية محفوظة ولن يتم حذفها عند التعديل.</p>
        <div className="flex flex-wrap gap-2">{submission.files.map((file) => <span key={file.Id} className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><FileText size={15} />{file.OriginalFileName}</span>)}</div>
      </section>}

      {message && <div className={`rounded-lg border p-4 text-sm ${messageType === "success" ? "border-green-200 bg-green-50 text-green-700" : messageType === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-red-200 bg-red-50 text-red-700"}`}>{messageType === "warning" && <AlertTriangle className="ml-2 inline" size={16} />}{message}</div>}

      {editAllowed && <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-5 text-lg font-bold text-[#163B63]">بيانات المشاركة</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><label className={labelClass}>عنوان المشاركة *</label><input name="title" value={form.title} onChange={updateField} className={inputClass} required maxLength={300} /></div>
            <div><label className={labelClass}>نوع المشاركة *</label><select name="submission_type" value={form.submission_type} onChange={updateField} className={inputClass}><option value="1">فردي</option><option value="2">فريق عمل</option></select></div>
            <div><label className={labelClass}>موقع التنفيذ</label><input name="location" value={form.location} onChange={updateField} className={inputClass} maxLength={200} /></div>
            {form.submission_type === "2" && <div className="md:col-span-2"><label className={labelClass}>أعضاء الفريق *</label><textarea name="team_members" value={form.team_members} onChange={updateField} className={textareaClass} required /></div>}
            <div className="md:col-span-2"><label className={labelClass}>التحدي *</label><textarea name="challenge" value={form.challenge} onChange={updateField} className={textareaClass} required /></div>
            <div className="md:col-span-2"><label className={labelClass}>الجهود والحل المطبق *</label><textarea name="efforts" value={form.efforts} onChange={updateField} className={textareaClass} required /></div>
            <div className="md:col-span-2"><label className={labelClass}>النتائج بالأرقام *</label><textarea name="results" value={form.results} onChange={updateField} className={textareaClass} required /></div>
            <div className="md:col-span-2"><label className={labelClass}>الأثر *</label><textarea name="impact" value={form.impact} onChange={updateField} className={textareaClass} required /></div>
            <div className="md:col-span-2"><label className={labelClass}>مصدر الإلهام</label><textarea name="inspiration" value={form.inspiration} onChange={updateField} className={textareaClass} /></div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#163B63]">معايير الترشيح *</h2>
          <div className="grid gap-3 sm:grid-cols-2">{criteriaOptions.map((criterion) => <label key={criterion.Id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 hover:bg-slate-50"><input type="checkbox" checked={selectedCriteria.includes(Number(criterion.Id))} onChange={() => toggleCriterion(Number(criterion.Id))} className="h-4 w-4 accent-[#163B63]" />{criterion.NameAr}</label>)}</div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-[#163B63]">إضافة مرفقات جديدة</h2>
          <p className="mb-4 text-xs text-slate-500">المرفقات السابقة ستظل محفوظة. الأنواع المدعومة PDF وWord والصور، بحد أقصى 20 ميجابايت للملف.</p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#163B63] px-4 py-3 text-sm font-semibold text-[#163B63] hover:bg-blue-50"><Upload size={17} /> اختيار ملفات<input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={addFiles} className="hidden" /></label>
          <div className="mt-4 space-y-3">{newFiles.map((item) => <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center"><span className="min-w-0 flex-1 truncate text-sm text-slate-700">{item.file.name}</span><select value={item.fileTypeId} onChange={(e) => setNewFiles((current) => current.map((f) => f.id === item.id ? { ...f, fileTypeId: e.target.value } : f))} className={`${inputClass} sm:max-w-56`}><option value="">نوع المرفق</option>{fileTypes.map((type) => <option key={type.Id} value={type.Id}>{type.NameAr}</option>)}</select><button type="button" onClick={() => setNewFiles((current) => current.filter((f) => f.id !== item.id))} className="self-end rounded-lg p-2 text-red-600 hover:bg-red-50 sm:self-auto" aria-label="حذف الملف من قائمة الإضافة"><Trash2 size={17} /></button></div>)}</div>
        </section>

        <div className="flex flex-wrap justify-end gap-3"><Link href="/employee/submissions" className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">إلغاء</Link><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#163B63] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0D2B4B] disabled:opacity-60"><Save size={17} />{saving ? "جاري الحفظ..." : "حفظ التعديلات"}</button></div>
      </form>}
    </main>
  );
}
