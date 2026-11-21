"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Check, CheckCircle2, Clock, FileText, Image as ImageIcon, Save, Search, Trash2, Upload, Users, UserRound, X,
} from "lucide-react";
import {
  Alert, Badge, Button, Card, Field, Input, PageHeader, PageLoader, Select, Textarea, cx,
} from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/lib/auth";
import { contestState, formatBytes, formatDate } from "@/lib/format";
import { createSubmission, getSubmissionOptions } from "@/services/employeeService";
import { createHRSubmission, getHRSubmissionOptions, lookupHREmployee } from "@/services/hrService";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;

const emptyForm = { location: "", title: "", challenge: "", efforts: "", results: "", impact: "", inspiration: "" };

const storyFields = [
  { name: "challenge", label: "طبيعة التحدي", placeholder: "ما المشكلة أو التحدي الذي واجهكم؟", required: false },
  { name: "efforts", label: "الجهود والحل المطبق", placeholder: "ما الخطوات والحلول التي تم تنفيذها؟", required: false },
  { name: "results", label: "النتائج بالأرقام", placeholder: "اذكر النتائج بأرقام ونسب قدر الإمكان...", required: false },
  { name: "impact", label: "الأثر", placeholder: "ما أثر هذا الإنجاز على العمل أو الشركة؟", required: false },
  { name: "inspiration", label: "ما يجعلها ملهمة للنشر", placeholder: "اختياري — لماذا تستحق هذه القصة النشر؟", required: false },
];

function Section({ id, step, title, subtitle, children }) {
  return (
    <Card id={id} className="scroll-mt-28 p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-primary-fg">{step}</span>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-fg-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

export default function NewSubmissionPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isHR = pathname.startsWith("/hr/");
  const toast = useToast();
  const { ready, user } = useSession(isHR ? "hr" : "employee");

  const [criteriaOptions, setCriteriaOptions] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [contest, setContest] = useState(null);
  const [targetEmployee, setTargetEmployee] = useState(null);
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [lookingUpEmployee, setLookingUpEmployee] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [submissionType, setSubmissionType] = useState("1");
  const [teamMembers, setTeamMembers] = useState("");
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const fileInput = useRef(null);

  const draftKey = !isHR && user ? `anrpc:draft:${user.empn}` : null;
  const state = contestState(contest);

  // Options
  useEffect(() => {
    if (!ready) return;
    (isHR ? getHRSubmissionOptions() : getSubmissionOptions())
      .then((data) => {
        setCriteriaOptions(data.criteria || []);
        setFileTypes(data.file_types || []);
        setContest(data.contest || null);
      })
      .catch((err) => setLoadError(err.message || "تعذر تحميل بيانات النموذج."))
      .finally(() => setLoadingOptions(false));
  }, [ready, isHR]);

  // Restore draft (text only — files cannot be stored)
  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || "null");
      if (saved) {
        setForm({ ...emptyForm, ...saved.form });
        setSubmissionType(saved.submissionType || "1");
        setTeamMembers(saved.teamMembers || "");
        setSelectedCriteria(saved.selectedCriteria || []);
        toast.info("تم استرجاع مسودتك المحفوظة تلقائيًا.");
      }
    } catch {
      // ignore corrupted drafts
    }
    setDraftLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Autosave draft
  useEffect(() => {
    if (!draftKey || !draftLoaded) return;
    const hasContent = Object.values(form).some(Boolean) || teamMembers || selectedCriteria.length;
    const timer = setTimeout(() => {
      try {
        if (hasContent) localStorage.setItem(draftKey, JSON.stringify({ form, submissionType, teamMembers, selectedCriteria }));
      } catch {
        // storage may be full/blocked
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [form, submissionType, teamMembers, selectedCriteria, draftKey, draftLoaded]);

  const clearDraft = useCallback(() => {
    if (draftKey) localStorage.removeItem(draftKey);
  }, [draftKey]);

  function resetForm() {
    clearDraft();
    setForm(emptyForm);
    setTeamMembers("");
    setSelectedCriteria([]);
    setSubmissionType("1");
    setFiles([]);
    setErrors({});
    toast.info("تم مسح المسودة.");
  }

  const update = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const toggleCriterion = (id) => {
    setSelectedCriteria((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setErrors((prev) => ({ ...prev, criteria: undefined }));
  };

  function addFiles(list) {
    const incoming = Array.from(list || []);
    const rejected = [];
    const accepted = [];

    incoming.forEach((file) => {
      if (!ALLOWED.test(file.name)) rejected.push(`${file.name}: نوع غير مدعوم`);
      else if (file.size > MAX_FILE_BYTES) rejected.push(`${file.name}: أكبر من 20 ميجابايت`);
      else accepted.push({ id: crypto.randomUUID(), file, fileTypeId: fileTypes[0]?.Id ? String(fileTypes[0].Id) : "" });
    });

    if (accepted.length) {
      setFiles((prev) => [...prev, ...accepted]);
      setErrors((prev) => ({ ...prev, files: undefined }));
    }
    if (rejected.length) toast.error(`تم تجاهل ${rejected.length} ملف — ${rejected[0]}`);
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  // Completion checklist
  const checklist = useMemo(
    () => [
      { key: "title", label: "عنوان القصة", done: form.title.trim().length > 0 },
      { key: "criteria", label: "معيار ترشيح واحد على الأقل", done: selectedCriteria.length > 0 },
      { key: "files", label: "مرفق واحد على الأقل", done: files.length > 0 },
    ],
    [form, selectedCriteria, submissionType, teamMembers, files]
  );
  const doneCount = checklist.filter((item) => item.done).length;
  const percent = Math.round((doneCount / checklist.length) * 100);

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = "برجاء إدخال عنوان القصة.";
    if (selectedCriteria.length === 0) next.criteria = "اختر معيار ترشيح واحدًا على الأقل.";
    if (files.length === 0) next.files = "برجاء إرفاق ملف واحد على الأقل.";
    else if (files.some((item) => !item.fileTypeId)) next.files = "برجاء اختيار نوع كل مرفق.";
    return next;
  }

  async function findEmployee() {
    if (!employeeNumber.trim()) {
      setSubmitError("أدخل رقم القيد أولاً.");
      return;
    }
    try {
      setLookingUpEmployee(true);
      setSubmitError("");
      const result = await lookupHREmployee(employeeNumber.trim());
      setTargetEmployee(result.employee);
    } catch (err) {
      setTargetEmployee(null);
      setSubmitError(err.message || "رقم القيد غير صحيح أو غير مسجل.");
    } finally {
      setLookingUpEmployee(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    if (isHR && !targetEmployee) {
      setSubmitError("ابحث عن الموظف برقم القيد أولاً.");
      document.getElementById("sec-info")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const found = validate();
    setErrors(found);
    const firstKey = Object.keys(found)[0];
    if (firstKey) {
      const target = ["title"].includes(firstKey) ? "sec-story" : ["criteria", "team"].includes(firstKey) ? "sec-info" : ["files"].includes(firstKey) ? "sec-files" : "sec-story";
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const body = new FormData();
    if (isHR) body.append("empn", String(targetEmployee.empn));
    body.append("title", form.title.trim());
    body.append("submission_type", submissionType);
    body.append("location", form.location);
    body.append("team_members", teamMembers);
    ["challenge", "efforts", "results", "impact", "inspiration"].forEach((key) => body.append(key, form[key]));
    selectedCriteria.forEach((id) => body.append("criteria[]", String(id)));
    files.forEach((item, index) => {
      body.append(`files[${index}][file_type_id]`, String(item.fileTypeId));
      body.append(`files[${index}][file]`, item.file);
    });

    try {
      setSubmitting(true);
      const result = isHR ? await createHRSubmission(body) : await createSubmission(body);
      clearDraft();
      toast.success(result.message || "تم حفظ المشاركة بنجاح.");
      setTimeout(() => router.push(isHR ? "/hr/submissions" : "/employee/submissions"), 900);
    } catch (err) {
      setSubmitError(err.message || "تعذر حفظ المشاركة.");
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (!ready) return <PageLoader />;

  const closed = !isHR && (!contest || state.key !== "open");
  const fieldLimit = (name) => `${form[name].length} حرف`;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="إضافة مشاركة جديدة"
        subtitle={isHR ? "تسجيل مشاركة نيابةً عن أحد الموظفين" : "نموذج المشاركة في قصص النجاح والتميز — يُحفظ ما تكتبه تلقائيًا كمسودة."}
        back={{ href: isHR ? "/hr/submissions" : "/employee/submissions", label: isHR ? "إدارة المشاركات" : "مشاركاتي" }}
        actions={!isHR && <Button variant="ghost" size="sm" icon={Trash2} onClick={resetForm}>مسح المسودة</Button>}
      />

      {contest && (
        <Alert tone={closed ? "danger" : "info"} className="mb-5">
          <b>{contest.ContestName}</b> — {state.label} · آخر موعد للتقديم: {formatDate(contest.DeadlineDate)}
          {state.key === "open" && state.daysLeft >= 0 && ` (${state.daysLeft === 0 ? "ينتهي اليوم" : `متبقي ${state.daysLeft} يوم`})`}
        </Alert>
      )}
      {!contest && !isHR && <Alert tone="danger" className="mb-5">لا توجد مسابقة مفعّلة حالياً، لذلك لا يمكن تقديم مشاركة جديدة.</Alert>}
      <Alert tone="danger" className="mb-5">{loadError}</Alert>
      <Alert tone="danger" className="mb-5" onClose={() => setSubmitError("")}>{submitError}</Alert>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form id="submission-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* 1 — Participant */}
          <Section id="sec-info" step="1" title="بيانات المشارك والترشيح" subtitle={isHR ? "ابحث برقم القيد لربط المشاركة بالموظف الصحيح." : "بيانات الموظف يتم تعبئتها تلقائيًا من حسابك."}>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="رقم القيد" required><div className="flex gap-2"><Input value={isHR ? employeeNumber : user?.empn || ""} onChange={(event) => { if (isHR) { setEmployeeNumber(event.target.value.replace(/\D/g, "")); setTargetEmployee(null); } }} readOnly={!isHR} dir="ltr" className="text-start" inputMode="numeric" />{isHR && <Button type="button" variant="outline" size="icon" loading={lookingUpEmployee} onClick={findEmployee} aria-label="البحث عن الموظف"><Search size={17} /></Button>}</div></Field>
              <Field label="الاسم" className="md:col-span-1"><Input value={isHR ? targetEmployee?.ename || "" : user?.ename || ""} readOnly /></Field>
              <Field label="المسمى الوظيفي"><Input value={isHR ? targetEmployee?.nwazifa || targetEmployee?.code_wazifa || "" : user?.nwazifa || user?.code_wazifa || ""} readOnly /></Field>
              <Field label="الإدارة"><Input value={isHR ? targetEmployee?.edara_text || "" : user?.edara_text || ""} readOnly /></Field>
            </div>

            <Field label="الموقع (مكتب / موقع تشغيلي)" className="mt-5" htmlFor="location">
              <Input id="location" name="location" value={form.location} onChange={update} placeholder="أدخل الموقع" maxLength={200} />
            </Field>

            <div className="mt-6">
              <p className="mb-3 text-[13px] font-semibold text-fg-muted">نوع الترشيح</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "1", label: "فردي", text: "مشاركة باسمك الشخصي", icon: UserRound },
                  { value: "2", label: "فريق عمل", text: "مشاركة جماعية بأكثر من عضو", icon: Users },
                ].map(({ value, label, text, icon: Icon }) => {
                  const active = submissionType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setSubmissionType(value); setErrors((p) => ({ ...p, team: undefined })); }}
                      aria-pressed={active}
                      className={cx(
                        "flex items-center gap-3 rounded-2xl border-2 p-4 text-start transition",
                        active ? "border-primary bg-primary-soft" : "border-line hover:border-fg-subtle"
                      )}
                    >
                      <span className={cx("flex h-11 w-11 items-center justify-center rounded-xl", active ? "bg-primary text-primary-fg" : "bg-surface-2 text-fg-muted")}><Icon size={20} /></span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold">{label}</span>
                        <span className="text-xs text-fg-muted">{text}</span>
                      </span>
                      {active && <CheckCircle2 size={20} className="text-primary" />}
                    </button>
                  );
                })}
              </div>

              {submissionType === "2" && (
                <Field label="أعضاء الفريق ومسمياتهم (اختياري)" error={errors.team} className="mt-4 animate-fade-in" htmlFor="team">
                  <Textarea id="team" value={teamMembers} onChange={(e) => { setTeamMembers(e.target.value); setErrors((p) => ({ ...p, team: undefined })); }} aria-invalid={!!errors.team} placeholder="اكتب اسم كل عضو ومسماه الوظيفي في سطر منفصل..." />
                </Field>
              )}
            </div>

            <div className="mt-7 border-t border-line pt-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-fg-muted">معايير الترشيح <span className="text-danger-fg">*</span></p>
                <Badge tone="primary">{selectedCriteria.length} مختار</Badge>
              </div>

              {loadingOptions ? (
                <p className="text-sm text-fg-muted">جاري تحميل المعايير...</p>
              ) : criteriaOptions.length === 0 ? (
                <p className="text-sm text-fg-muted">لا توجد معايير نشطة في إعدادات المسابقة.</p>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {criteriaOptions.map((criterion) => {
                    const active = selectedCriteria.includes(criterion.Id);
                    return (
                      <button
                        key={criterion.Id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleCriterion(criterion.Id)}
                        className={cx(
                          "flex items-center gap-3 rounded-xl border px-4 py-3 text-start text-sm transition",
                          active ? "border-primary bg-primary-soft font-semibold text-primary" : "border-line hover:bg-surface-2"
                        )}
                      >
                        <span className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", active ? "border-primary bg-primary text-primary-fg" : "border-fg-subtle")}>
                          {active && <Check size={13} strokeWidth={3} />}
                        </span>
                        {criterion.NameAr}
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.criteria && <p className="mt-2 text-xs text-danger-fg">{errors.criteria}</p>}
            </div>
          </Section>

          {/* 2 — Story */}
          <Section id="sec-story" step="2" title="قصة النجاح" subtitle="عنوان القصة مطلوب، وباقي التفاصيل اختيارية.">
            <div className="space-y-5">
              <Field label="عنوان القصة" required error={errors.title} htmlFor="title" hint={`${form.title.length} / 300`}>
                <Input id="title" name="title" value={form.title} onChange={update} maxLength={300} aria-invalid={!!errors.title} placeholder="عنوان مختصر ومعبّر عن الإنجاز" />
              </Field>

              {storyFields.map((field) => (
                <Field key={field.name} label={field.label} required={field.required} error={errors[field.name]} hint={fieldLimit(field.name)} htmlFor={field.name}>
                  <Textarea id={field.name} name={field.name} value={form[field.name]} onChange={update} aria-invalid={!!errors[field.name]} placeholder={field.placeholder} />
                </Field>
              ))}
            </div>
          </Section>

          {/* 3 — Files */}
          <Section id="sec-files" step="3" title="المرفقات" subtitle="PDF أو Word أو صور (JPG, PNG) — حتى 20 ميجابايت للملف الواحد.">
            <input ref={fileInput} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />

            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cx(
                "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition",
                dragging ? "border-primary bg-primary-soft" : errors.files ? "border-danger-fg bg-danger-bg/40" : "border-line hover:border-primary hover:bg-primary-soft/50"
              )}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Upload size={26} /></span>
              <span className="mt-4 text-sm font-bold">اسحب الملفات هنا أو اضغط للاختيار</span>
              <span className="mt-1.5 text-xs text-fg-muted">يمكنك إضافة أكثر من ملف</span>
            </button>
            {errors.files && <p className="mt-2 text-xs text-danger-fg">{errors.files}</p>}

            {files.length > 0 && (
              <ul className="mt-5 space-y-3">
                {files.map((item) => {
                  const isImg = /\.(png|jpe?g)$/i.test(item.file.name);
                  return (
                    <li key={item.id} className="grid items-center gap-3 rounded-2xl border border-line p-3 sm:grid-cols-[1fr_220px_auto]">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                          {isImg ? <ImageIcon size={20} /> : <FileText size={20} />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{item.file.name}</p>
                          <p className="text-xs text-fg-subtle">{formatBytes(item.file.size)}</p>
                        </div>
                      </div>
                      <Select
                        value={item.fileTypeId}
                        onChange={(e) => setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, fileTypeId: e.target.value } : f)))}
                        className="h-10"
                        aria-label="نوع المرفق"
                      >
                        <option value="">اختر نوع المرفق</option>
                        {fileTypes.map((type) => <option key={type.Id} value={type.Id}>{type.NameAr}</option>)}
                      </Select>
                      <Button variant="danger" size="icon" onClick={() => setFiles((prev) => prev.filter((f) => f.id !== item.id))} aria-label="حذف المرفق">
                        <X size={17} />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </form>

        {/* Summary */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">اكتمال النموذج</h3>
              <span className="text-sm font-extrabold text-primary" dir="ltr">{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>

            <ul className="mt-5 space-y-2.5">
              {checklist.map((item) => (
                <li key={item.key} className={cx("flex items-center gap-2.5 text-[13px]", item.done ? "text-fg" : "text-fg-subtle")}>
                  <span className={cx("flex h-5 w-5 items-center justify-center rounded-full", item.done ? "bg-success-bg text-success-fg" : "bg-surface-2")}>
                    {item.done && <Check size={12} strokeWidth={3} />}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>

            <Button type="submit" form="submission-form" size="lg" loading={submitting} disabled={loadingOptions || closed} icon={Save} className="mt-6 w-full">
              {submitting ? "جاري رفع المشاركة..." : "حفظ المشاركة"}
            </Button>
            <Button href={isHR ? "/hr/submissions" : "/employee/submissions"} variant="ghost" className="mt-2 w-full">إلغاء</Button>
            {closed && <p className="mt-3 flex items-center gap-1.5 text-xs text-danger-fg"><Clock size={13} /> {state.label}</p>}
          </Card>
        </aside>
      </div>
    </div>
  );
}
