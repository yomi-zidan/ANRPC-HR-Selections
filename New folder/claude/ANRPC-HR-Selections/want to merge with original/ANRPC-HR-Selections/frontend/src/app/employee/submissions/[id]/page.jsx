"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Building2, CalendarDays, Check, Download, Eye, FileText, Lightbulb, MapPin,
  Paperclip, Rocket, Target, TrendingUp, Users, Wrench,
} from "lucide-react";
import FilePreviewModal from "@/components/submissions/FilePreviewModal";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorState, PageLoader, PageHeader } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { downloadBlob, formatBytes, formatDate, isTeam, typeLabel } from "@/lib/format";
import { getMyFileBlob, getMySubmission } from "@/services/employeeService";

const sections = [
  { key: "challenge", title: "التحدي", icon: Target, tone: "bg-info-bg text-info-fg" },
  { key: "efforts", title: "الجهود والحل", icon: Wrench, tone: "bg-primary-soft text-primary" },
  { key: "results", title: "النتائج بالأرقام", icon: TrendingUp, tone: "bg-success-bg text-success-fg" },
  { key: "impact", title: "الأثر", icon: Rocket, tone: "bg-warning-bg text-warning-fg" },
  { key: "inspiration", title: "ما يجعلها ملهمة", icon: Lightbulb, tone: "bg-accent/20 text-warning-fg" },
];

export default function EmployeeSubmissionDetailsPage() {
  const { id } = useParams();
  const toast = useToast();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyFile, setBusyFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let active = true;
    getMySubmission(id)
      .then((data) => active && setSubmission(data))
      .catch((err) => active && setError(err.message || "تعذر تحميل تفاصيل المشاركة."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  useEffect(() => () => preview?.url && URL.revokeObjectURL(preview.url), [preview]);

  async function handle(file, mode) {
    try {
      setBusyFile(`${mode}-${file.id}`);
      const blob = await getMyFileBlob(file.id);
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
        <PageHeader title="تعذر فتح المشاركة" back={{ href: "/employee/submissions", label: "العودة لمشاركاتي" }} />
        <ErrorState message={error || "المشاركة غير موجودة."} />
      </>
    );
  }

  const details = sections.filter((section) => submission[section.key]);

  return (
    <div className="animate-fade-up">
      <PageHeader title="تفاصيل المشاركة" back={{ href: "/employee/submissions", label: "مشاركاتي" }} />

      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="relative bg-sidebar px-6 py-7 text-white sm:px-9 sm:py-9">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_90%_0%,black,transparent_70%)]" />
          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">مشاركة رقم {submission.id}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200">
                <Check size={13} /> تم التقديم
              </span>
            </div>
            <h2 className="max-w-4xl text-xl font-extrabold leading-relaxed sm:text-2xl">{submission.title}</h2>
          </div>
        </div>

        <dl className="grid divide-y divide-line sm:grid-cols-4 sm:divide-x sm:divide-x-reverse sm:divide-y-0">
          {[
            { icon: Building2, label: "الإدارة", value: submission.department_name || "—" },
            { icon: isTeam(submission.submission_type) ? Users : FileText, label: "نوع المشاركة", value: typeLabel(submission.submission_type) },
            { icon: MapPin, label: "الموقع", value: submission.location || "—" },
            { icon: CalendarDays, label: "تاريخ التقديم", value: formatDate(submission.created_at) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-6 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon size={18} /></span>
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold text-fg-subtle">{label}</dt>
                <dd className="mt-0.5 truncate text-sm font-bold">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Card>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Story */}
        <div className="space-y-4">
          {isTeam(submission.submission_type) && submission.team_members && (
            <Card className="p-5 sm:p-6">
              <h3 className="flex items-center gap-2 text-sm font-bold"><Users size={17} className="text-primary" /> أعضاء الفريق</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-8 text-fg-muted">{submission.team_members}</p>
            </Card>
          )}

          {details.map(({ key, title, icon: Icon, tone }) => (
            <Card key={key} className="p-5 sm:p-6">
              <h3 className="flex items-center gap-3 text-[15px] font-bold">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={17} /></span>
                {title}
              </h3>
              <p className="mt-4 whitespace-pre-line text-sm leading-8 text-fg-muted">{submission[key]}</p>
            </Card>
          ))}
        </div>

        {/* Side */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card>
            <CardHeader title="معايير المشاركة" action={<Badge>{submission.criteria?.length || 0}</Badge>} />
            {submission.criteria?.length ? (
              <ul className="space-y-3 p-5">
                {submission.criteria.map((criterion) => (
                  <li key={criterion.id} className="flex items-start gap-2.5 text-sm leading-6">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-bg text-success-fg"><Check size={11} strokeWidth={3} /></span>
                    {criterion.name}
                  </li>
                ))}
              </ul>
            ) : <p className="p-5 text-sm text-fg-muted">لا توجد معايير مسجلة.</p>}
          </Card>

          <Card>
            <CardHeader title="المرفقات" action={<Badge>{submission.files?.length || 0}</Badge>} />
            {submission.files?.length ? (
              <ul className="space-y-2.5 p-4">
                {submission.files.map((file) => (
                  <li key={file.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-primary shadow-sm"><FileText size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold">{file.name}</span>
                      <span className="mt-0.5 block text-[11px] text-fg-subtle">{file.type_name || "ملف"} · {formatBytes(file.size)}</span>
                    </span>
                    <Button variant="ghost" size="icon" className="!h-8 !w-8" loading={busyFile === `preview-${file.id}`} onClick={() => handle(file, "preview")} aria-label={`معاينة ${file.name}`}>
                      <Eye size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="!h-8 !w-8" loading={busyFile === `download-${file.id}`} onClick={() => handle(file, "download")} aria-label={`تنزيل ${file.name}`}>
                      <Download size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Paperclip} title="لا توجد مرفقات" className="py-8" />
            )}
          </Card>
        </aside>
      </div>

      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
