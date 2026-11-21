"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BarChart3, Building2, CheckCircle2, ClipboardList, Clock, PieChart, RefreshCw, Trophy, Users, Star,
} from "lucide-react";
import {
  Badge, Button, Card, CardHeader, EmptyState, ErrorState, Skeleton, StatCard,
} from "@/components/ui";
import { contestState, formatDate, formatNumber } from "@/lib/format";
import { getHRDashboard, getHRSettings } from "@/services/hrService";

function EvaluationPieChart({ data, loading }) {
  const evaluated = Number(data?.evaluated_submissions || 0);
  const pending = Number(data?.pending_submissions || 0);
  const total = evaluated + pending;
  const percent = total ? evaluated / total : 0;
  const circumference = 326.73;
  const offset = circumference * (1 - percent);

  return (
    <Card className="overflow-hidden animate-fade-up">
      <CardHeader icon={PieChart} title="حالة تقييم المشاركات" subtitle="المشاركات التي تم تقييمها والتي ما زالت قيد التقييم" />
      {loading ? <div className="flex min-h-64 items-center justify-center"><Skeleton className="h-36 w-36 !rounded-full" /></div> : (
        <div className="flex min-h-64 flex-col items-center justify-center gap-6 p-5 sm:flex-row sm:gap-10 sm:p-7">
          <div className="relative h-40 w-40 shrink-0">
            <svg viewBox="0 0 120 120" role="img" aria-label={`تم تقييم ${evaluated} مشاركة وبقي ${pending} قيد التقييم`} className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#eeb652" strokeWidth="13" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#23836d" strokeWidth="13" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ "--pie-offset": offset }} className="dashboard-pie" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-3xl font-extrabold" dir="ltr">{Math.round(percent * 100)}%</strong><span className="mt-1 text-[11px] text-fg-muted">تم تقييمها</span></div>
          </div>
          <div className="w-full max-w-[220px] space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-xl bg-success-bg/70 px-4 py-3"><span className="flex items-center gap-2 text-xs font-semibold text-fg-muted"><i className="h-2.5 w-2.5 rounded-full bg-[#23836d]" /> تم تقييمها</span><b className="text-lg text-success-fg">{evaluated}</b></div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-warning-bg/70 px-4 py-3"><span className="flex items-center gap-2 text-xs font-semibold text-fg-muted"><i className="h-2.5 w-2.5 rounded-full bg-[#eeb652]" /> قيد التقييم</span><b className="text-lg text-warning-fg">{pending}</b></div>
            <p className="text-center text-[11px] text-fg-subtle">إجمالي المشاركات: {total}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function DepartmentSubmissionChart({ departments, loading }) {
  const maxCount = Math.max(1, ...departments.map((item) => Number(item.submissions_count || 0)));
  return (
    <Card className="overflow-hidden animate-fade-up">
      <CardHeader icon={BarChart3} title="المشاركات حسب الإدارة" subtitle="مقارنة عدد المشاركات المقدمة في كل إدارة" />
      {loading ? <div className="space-y-4 p-6">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-8 w-full" />)}</div> : departments.length ? (
        <div className="space-y-5 p-5 sm:p-7">
          {departments.map((department, index) => {
            const count = Number(department.submissions_count || 0);
            return <div key={department.id} className="grid grid-cols-[minmax(90px,150px)_1fr_38px] items-center gap-3 sm:grid-cols-[minmax(120px,210px)_1fr_45px] sm:gap-5"><span className="truncate text-xs font-semibold text-fg-muted sm:text-sm">{department.name}</span><div className="h-3 overflow-hidden rounded-full bg-surface-2"><div className="department-chart-bar h-full rounded-full bg-gradient-to-l from-primary to-[#72b9b1]" style={{ width: `${(count / maxCount) * 100}%`, animationDelay: `${index * 65}ms` }} /></div><b className="text-left text-xs tabular-nums" dir="ltr">{formatNumber(count)}</b></div>;
          })}
        </div>
      ) : <EmptyState icon={Building2} title="لا توجد إدارات مشاركة حتى الآن" />}
    </Card>
  );
}

export default function HRDashboardPage() {
  const [data, setData] = useState(null);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [dashboard, settings] = await Promise.allSettled([getHRDashboard(), getHRSettings()]);

    if (dashboard.status === "fulfilled") setData(dashboard.value);
    else setError(dashboard.reason?.message || "حدث خطأ أثناء تحميل بيانات لوحة المتابعة.");

    if (settings.status === "fulfilled") setContest(settings.value?.contest || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;

  const departments = [...(data?.departments || [])].sort((a, b) => Number(b.submissions_count || 0) - Number(a.submissions_count || 0));
  const recent = data?.recent_submissions || [];
  const maxSubmissions = Math.max(1, ...departments.map((d) => Number(d.submissions_count || 0)));
  const state = contestState(contest);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-sidebar p-6 text-white shadow-pop sm:p-9 animate-fade-up">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_85%_0%,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-28 start-16 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-accent">نظرة عامة</span>
              {contest && <Badge tone={state.tone}>{state.label}</Badge>}
            </div>
            <h1 className="text-2xl font-extrabold leading-snug sm:text-3xl">لوحة متابعة المشاركات</h1>
            <p className="mt-3 text-sm leading-7 text-white/70">
              {contest ? (
                <>
                  {contest.ContestName} — آخر موعد للتقديم <b className="text-white">{formatDate(contest.DeadlineDate)}</b>
                  {state.key === "open" && state.daysLeft >= 0 && <> (متبقي {state.daysLeft} يوم)</>}
                </>
              ) : (
                "ملخص المشاركات والتقييمات ومعدلات التفاعل بين الإدارات."
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/hr/submissions" variant="outline" className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/20">
              <ClipboardList size={17} /> المشاركات
            </Button>
            <Button href="/hr/ranking" variant="accent" icon={Trophy}>
              عرض الترتيب <ArrowLeft size={15} />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={loading} title="إجمالي المشاركات" value={formatNumber(data?.total_submissions)} icon={ClipboardList} />
        <StatCard loading={loading} title="تم تقييمها" value={formatNumber(data?.evaluated_submissions)} icon={CheckCircle2} tone="success" />
        <StatCard loading={loading} title="بانتظار التقييم" value={formatNumber(data?.pending_submissions)} icon={Clock} tone="warning" />
        <StatCard loading={loading} title="الإدارات المشاركة" value={formatNumber(data?.total_departments)} icon={Building2} tone="info" />
      </div>

      <div className="grid items-stretch gap-5 xl:grid-cols-2">
        <EvaluationPieChart data={data} loading={loading} />
        <DepartmentSubmissionChart departments={departments} loading={loading} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Departments */}
        <Card>
          <CardHeader
            icon={Building2}
            title="ملخص الإدارات"
            subtitle="المشاركات ومتوسط التقييم لكل إدارة"
            action={
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تحديث
              </Button>
            }
          />

          {loading ? (
            <div className="space-y-3 p-6">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : departments.length === 0 ? (
            <EmptyState icon={Users} title="لا توجد إدارات مشاركة حتى الآن" />
          ) : (
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full min-w-[620px] text-start">
                <thead className="text-xs font-bold text-fg-muted">
                  <tr className="border-b border-line bg-surface-2/60">
                    <th className="px-6 py-3.5 text-start">الإدارة</th>
                    <th className="px-4 py-3.5 text-start">المشاركات</th>
                    <th className="px-4 py-3.5 text-center">الموظفون</th>
                    <th className="px-4 py-3.5 text-center">متوسط التقييم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {departments.map((department) => {
                    const count = Number(department.submissions_count || 0);
                    const average = Number(department.average_rating || 0);
                    return (
                      <tr key={department.id} className="transition hover:bg-surface-2/50">
                        <td className="px-6 py-4 text-sm font-semibold">{department.name}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-2">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${(count / maxSubmissions) * 100}%` }} />
                            </div>
                            <span className="text-sm font-bold" dir="ltr">{formatNumber(count)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-fg-muted" dir="ltr">{formatNumber(department.participants_count)}</td>
                        <td className="px-4 py-4 text-center">
                          {average > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-warning-fg" dir="ltr">
                              <Star size={12} className="fill-current" /> {average.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-fg-subtle">لا يوجد تقييم</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          {/* Recent */}
          <Card>
            <CardHeader
              title="أحدث المشاركات"
              subtitle="آخر القصص الواردة وحالة تقييمها"
              action={<Link href="/hr/submissions" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">الكل <ArrowLeft size={13} /></Link>}
            />
            {loading ? (
              <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : recent.length === 0 ? (
              <EmptyState icon={ClipboardList} title="لا توجد مشاركات حتى الآن" className="py-10" />
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((item) => {
                  const done = Number(item.review_count) > 0;
                  return (
                    <li key={item.id}>
                      <Link href={`/hr/submissions/${item.id}`} className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface-2/60">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{item.title}</p>
                          <p className="mt-1 truncate text-xs text-fg-muted">{item.employee_name || "موظف"} · {item.department_name || "—"}</p>
                        </div>
                        <Badge tone={done ? "success" : "warning"}>{done ? "تم التقييم" : "بانتظار"}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
