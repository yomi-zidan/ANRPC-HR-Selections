"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CalendarDays, Clock, FilePlus2, FileText, Inbox, MapPin,
  Paperclip, RefreshCw, Search, Sparkles, Users, UserRound,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, ErrorState, Input, Skeleton, StatCard } from "@/components/ui";
import { useSession } from "@/lib/auth";
import { contestState, formatDate, isTeam, typeLabel } from "@/lib/format";
import { getMySubmissions, getSubmissionOptions } from "@/services/employeeService";

export default function MySubmissionsPage() {
  const { user } = useSession("employee");
  const [submissions, setSubmissions] = useState([]);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [list, options] = await Promise.allSettled([getMySubmissions(), getSubmissionOptions()]);

    if (list.status === "fulfilled") setSubmissions(list.value);
    else setError(list.reason?.message || "تعذر تحميل المشاركات.");

    if (options.status === "fulfilled") setContest(options.value.contest || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const state = contestState(contest);
  const canSubmit = !contest || state.key === "open";
  const attachments = submissions.reduce((sum, item) => sum + (item.files?.length || 0), 0);
  const latest = submissions[0]?.created_at;

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return submissions;
    return submissions.filter((item) => `${item.title} ${item.location || ""}`.toLowerCase().includes(text));
  }, [submissions, query]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-sidebar p-6 text-white shadow-pop sm:p-9 animate-fade-up">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_80%_0%,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-24 start-10 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles size={13} /> {contest?.ContestName || "قصص النجاح والتميز"}
            </span>
            <h1 className="mt-4 text-2xl font-extrabold leading-snug sm:text-3xl">
              أهلًا {user?.ename?.split(" ")[0] || "بك"}، شارك قصة نجاحك
            </h1>
            <p className="mt-3 text-sm leading-7 text-white/70">
              تابع جميع مشاركاتك في مكان واحد، وأضف قصة جديدة قبل انتهاء موعد التقديم.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            {contest && (
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <Badge tone={state.tone}>{state.label}</Badge>
                </div>
                <p className="mt-2 flex items-center gap-2 text-xs text-white/75">
                  <Clock size={14} />
                  آخر موعد: {formatDate(contest.DeadlineDate)}
                  {state.key === "open" && state.daysLeft >= 0 && (
                    <b className="text-accent">
                      ({state.daysLeft === 0 ? "ينتهي اليوم" : `متبقي ${state.daysLeft} يوم`})
                    </b>
                  )}
                </p>
              </div>
            )}
            <Button
              href={canSubmit ? "/employee/submissions/new" : undefined}
              disabled={!canSubmit}
              variant="accent"
              size="lg"
              icon={FilePlus2}
              onClick={canSubmit ? undefined : (e) => e.preventDefault()}
            >
              إضافة مشاركة جديدة
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="إجمالي مشاركاتي" value={submissions.length} icon={FileText} loading={loading} />
        <StatCard title="إجمالي المرفقات" value={attachments} icon={Paperclip} tone="info" loading={loading} />
        <StatCard
          title="آخر مشاركة"
          value={<span className="text-xl">{latest ? formatDate(latest, { day: "numeric", month: "short" }) : "—"}</span>}
          icon={CalendarDays}
          tone="warning"
          loading={loading}
        />
      </div>

      {/* List */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[15px] font-bold">قائمة المشاركات</h2>
            <p className="mt-0.5 text-xs text-fg-muted">جميع المشاركات المسجلة برقمك الوظيفي</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="flex-1 sm:w-64">
              <Input icon={Search} placeholder="بحث في مشاركاتي..." value={query} onChange={(e) => setQuery(e.target.value)} className="h-10" />
            </div>
            <Button variant="outline" size="icon" onClick={load} disabled={loading} aria-label="تحديث">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 p-6">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : error ? (
          <div className="p-6"><ErrorState message={error} onRetry={load} /></div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="لا توجد مشاركات حتى الآن"
            text="لم تقم بتسجيل أي مشاركة في المسابقة بعد. ابدأ بإضافة قصة نجاح جديدة."
            action={canSubmit && <Button href="/employee/submissions/new" icon={FilePlus2}>إضافة أول مشاركة</Button>}
          />
        ) : visible.length === 0 ? (
          <EmptyState icon={Search} title="لا توجد نتائج مطابقة" text="جرّب كلمات بحث مختلفة." />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/employee/submissions/${item.id}`}
                  className="group flex flex-col gap-4 p-5 transition hover:bg-surface-2/60 sm:flex-row sm:items-center sm:px-6"
                >
                  <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary sm:flex">
                    {isTeam(item.submission_type) ? <Users size={21} /> : <UserRound size={21} />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="primary">#{item.id}</Badge>
                      <Badge tone="success">تم التقديم</Badge>
                      <Badge tone={isTeam(item.submission_type) ? "info" : "neutral"}>{typeLabel(item.submission_type)}</Badge>
                    </div>
                    <h3 className="mt-2.5 truncate text-base font-bold">{item.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-fg-muted">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{formatDate(item.created_at)}</span>
                      {item.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{item.location}</span>}
                      <span className="inline-flex items-center gap-1.5"><Paperclip size={14} />{item.files?.length || 0} مرفق</span>
                    </div>
                    {item.criteria?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.criteria.slice(0, 3).map((criterion, i) => (
                          <span key={i} className="rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] text-fg-muted">{criterion.NameAr}</span>
                        ))}
                        {item.criteria.length > 3 && (
                          <span className="rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-fg-muted">+{item.criteria.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    عرض التفاصيل
                    <ArrowLeft size={16} className="transition group-hover:-translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
