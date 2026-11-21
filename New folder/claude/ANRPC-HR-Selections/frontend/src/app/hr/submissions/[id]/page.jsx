"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Building2, CalendarDays, Check, Download, Eye, FileText, Hash, Lightbulb, MapPin, Paperclip,
  Rocket, Save, Target, TrendingUp, UserRound, Users, Wrench, MessageSquareText,
} from "lucide-react";
import FilePreviewModal from "@/components/submissions/FilePreviewModal";
import {
  Alert, Badge, Button, Card, CardHeader, EmptyState, ErrorState, PageHeader, PageLoader, Stars, Textarea,
} from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { downloadBlob, formatBytes, formatDate, isTeam, typeLabel } from "@/lib/format";
import { evaluateSubmission, getHRFileBlob, getHRSubmission } from "@/services/hrService";

const sections = [
  { key: "challenge", title: "التحدي", icon: Target, tone: "bg-info-bg text-info-fg" },
  { key: "efforts", title: "الجهود والحل", icon: Wrench, tone: "bg-primary-soft text-primary" },
  { key: "results", title: "النتائج بالأرقام", icon: TrendingUp, tone: "bg-success-bg text-success-fg" },
  { key: "impact", title: "الأثر", icon: Rocket, tone: "bg-warning-bg text-warning-fg" },
  { key: "inspiration", title: "ملهمة للنشر", icon: Lightbulb, tone: "bg-accent/20 text-warning-fg" },
];

const starLabels = ["", "ضعيف", "مقبول", "جيد", "جيد جدًا", "ممتاز"];

export default function HRSubmissionDetailsPage() {
  const { id } = useParams();
  const toast = useToast();

  const [submission, setSubmission] = useState(null);
  const [stars, setStars] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [busyFile, setBusyFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getHRSubmission(id);
      setSubmission(data);
      setStars(Number(data.my_review?.Stars || 0));
      setNotes(data.my_review?.Notes || "");
    } catch (err) {
      setError(err.message || "تعذر تحميل تفاصيل المشاركة.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => preview?.url && URL.revokeObjectURL(preview.url), [preview]);

  async function save(event) {
    event.preventDefault();
    if (stars < 1) return setFormError("اختر التقييم من نجمة إلى خمس نجوم.");

    try {
      setSaving(true);
      setFormError("");
      await evaluateSubmission(id, { stars, notes });
      toast.success("تم حفظ التقييم بنجاح.");
      const fresh = await getHRSubmission(id);
      setSubmission(fresh);
    } catch (err) {
      setFormError(err.message || "تعذر حفظ التقييم.");
    } finally {
      setSaving(false);
    }
  }

  async function openFile(file, mode) {
    try {
      setBusyFile(`${mode}-${file.id}`);
      const blob = await getHRFileBlob(file.id);
      if (mode === "download") downloadBlob(blob, file.name);
      else setPreview({ id: file.id, name: file.name, blob, url: URL.createObjectURL(blob) });
    } catch (err) {
      toast.error(err.message || "تعذر فتح المرفق.");
    } finally {
      setBusyFile(null);
    }
  }

  if (loading) return <PageLoader text="جاري تحميل تفاصيل المشاركة..." />;
  if (error || !submission) {
    return (
      <>
        <PageHeader title="تعذر فتح المشاركة" back={{ href: "/hr/submissions", label: "العودة إلى المشاركات" }} />
        <ErrorState message={error || "المشاركة غير موجودة."} onRetry={load} />
      </>
    );
  }

  const meta = [
    { icon: UserRound, label: "الموظف", value: submission.employee_name },
    { icon: Hash, label: "الرقم الوظيفي", value: submission.empn },
    { icon: Building2, label: "الإدارة", value: submission.department_name || "—" },
    { icon: isTeam(submission.submission_type) ? Users : FileText, label: "نوع الترشيح", value: typeLabel(submission.submission_type) },
    { icon: MapPin, label: "الموقع", value: submission.location || "—" },
    { icon: CalendarDays, label: "تاريخ التقديم", value: formatDate(submission.created_at) },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="تفاصيل المشاركة والتقييم"
        back={{ href: "/hr/submissions", label: "العودة إلى المشاركات" }}
        actions={submission.my_review ? <Badge tone="success" icon={Check}>تم تقييمها بواسطتك</Badge> : <Badge tone="warning">بانتظار تقييمك</Badge>}
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          {/* Summary */}
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-gradient-to-l from-primary-soft to-transparent px-6 py-6 sm:px-8">
              <Badge tone="primary">مشاركة #{submission.id}</Badge>
              <h2 className="mt-3 text-xl font-extrabold leading-relaxed sm:text-2xl">{submission.title}</h2>
            </div>

            <dl className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
              {meta.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 bg-surface px-6 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon size={18} /></span>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-semibold text-fg-subtle">{label}</dt>
                    <dd className="mt-0.5 truncate text-sm font-bold">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            {submission.team_members && (
              <div className="border-t border-line px-6 py-5 sm:px-8">
                <h3 className="text-sm font-bold">أعضاء الفريق</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-8 text-fg-muted">{submission.team_members}</p>
              </div>
            )}

            <div className="border-t border-line px-6 py-5 sm:px-8">
              <h3 className="mb-3 text-sm font-bold">معايير المشاركة</h3>
              <div className="flex flex-wrap gap-2">
                {submission.criteria?.length ? (
                  submission.criteria.map((criterion) => <Badge key={criterion.Id} tone="primary" className="!px-3.5 !py-1.5 !text-xs">{criterion.NameAr}</Badge>)
                ) : (
                  <span className="text-sm text-fg-subtle">لا توجد معايير مسجلة.</span>
                )}
              </div>
            </div>
          </Card>

          {/* Story */}
          {sections.map(({ key, title, icon: Icon, tone }) => (
            <Card key={key} className="p-6 sm:p-8">
              <h3 className="flex items-center gap-3 text-base font-bold">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={19} /></span>
                {title}
              </h3>
              <div className="mt-5 whitespace-pre-wrap text-[15px] leading-8 text-fg-muted">
                {submission[key] || <span className="text-fg-subtle">لم يتم إدخال بيانات.</span>}
              </div>
            </Card>
          ))}

          {/* Attachments */}
          <Card>
            <CardHeader icon={Paperclip} title="المرفقات" action={<Badge>{submission.files?.length || 0}</Badge>} />
            {submission.files?.length ? (
              <ul className="divide-y divide-line">
                {submission.files.map((file) => (
                  <li key={file.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><FileText size={20} /></span>
                      <div className="min-w-0">
                        <p className="break-all text-sm font-semibold">{file.name}</p>
                        <p className="mt-0.5 text-xs text-fg-subtle">{file.type_name || "مرفق"}{file.size ? ` · ${formatBytes(file.size)}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="soft" size="sm" icon={Eye} loading={busyFile === `preview-${file.id}`} onClick={() => openFile(file, "preview")}>معاينة</Button>
                      <Button variant="outline" size="sm" icon={Download} loading={busyFile === `download-${file.id}`} onClick={() => openFile(file, "download")}>تنزيل</Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Paperclip} title="لا توجد مرفقات" className="py-10" />
            )}
          </Card>
        </div>

        {/* Evaluation */}
        <aside className="xl:sticky xl:top-24">
          <form onSubmit={save}>
            <Card className="overflow-hidden">
              <div className="bg-sidebar px-6 py-5 text-white">
                <h2 className="text-lg font-extrabold">تقييم المشاركة</h2>
                <p className="mt-1 text-xs text-white/60">اختر من نجمة إلى خمس نجوم وأضف ملاحظاتك</p>
              </div>

              <div className="p-6">
                <div className="flex flex-col items-center rounded-2xl bg-surface-2 py-6">
                  <Stars value={stars} onChange={(v) => { setStars(v); setFormError(""); }} size={38} />
                  <p className="mt-3 h-6 text-sm font-bold text-warning-fg">
                    {stars > 0 ? `${stars} من 5 — ${starLabels[stars]}` : <span className="font-medium text-fg-subtle">لم يتم اختيار تقييم</span>}
                  </p>
                </div>

                <label className="mb-2 mt-6 flex items-center gap-2 text-[13px] font-semibold text-fg-muted">
                  <MessageSquareText size={15} /> ملاحظات التقييم
                </label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} maxLength={4000} placeholder="اكتب ملاحظاتك حول المشاركة..." />
                <p className="mt-1.5 text-end text-[11px] text-fg-subtle" dir="ltr">{notes.length} / 4000</p>

                <Alert tone="danger" className="mt-4">{formError}</Alert>

                <Button type="submit" size="lg" loading={saving} disabled={stars === 0} icon={Save} className="mt-5 w-full">
                  {saving ? "جاري الحفظ..." : submission.my_review ? "تحديث التقييم" : "حفظ التقييم"}
                </Button>
                {submission.my_review && <p className="mt-3 text-center text-xs text-fg-subtle">يمكنك تعديل تقييمك وحفظه مرة أخرى.</p>}
              </div>
            </Card>
          </form>
        </aside>
      </div>

      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
