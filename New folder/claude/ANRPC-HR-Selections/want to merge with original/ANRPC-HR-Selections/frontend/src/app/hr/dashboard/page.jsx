"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Building2, CheckCircle2, ClipboardList, Clock, RefreshCw, Trophy, Users, Star,
} from "lucide-react";
import {
  Badge, Button, Card, CardHeader, EmptyState, ErrorState, ProgressRing, Skeleton, StatCard,
} from "@/components/ui";
import { contestState, formatDate, formatNumber } from "@/lib/format";
import { getHRDashboard, getHRSettings } from "@/services/hrService";

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

  const departments = data?.departments || [];
  const recent = data?.recent_submissions || [];
  const total = Number(data?.total_submissions || 0);
  const evaluated = Number(data?.evaluated_submissions || 0);
  const percent = total ? Math.round((evaluated / total) * 100) : 0;
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
            <h1 className="text-2xl font-extrabold leading-snug sm:text-3xl">لوحة متابعة الاختيارات</h1>
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard loading={loading} title="إجمالي المشاركات" value={formatNumber(data?.total_submissions)} icon={ClipboardList} />
        <StatCard loading={loading} title="تم تقييمها" value={formatNumber(data?.evaluated_submissions)} icon={CheckCircle2} tone="success" />
        <StatCard loading={loading} title="بانتظار التقييم" value={formatNumber(data?.pending_submissions)} icon={Clock} tone="warning" />
        <StatCard loading={loading} title="الإدارات المشاركة" value={formatNumber(data?.total_departments)} icon={Building2} tone="info" />
        <StatCard loading={loading} title="متوسط التقييم العام" value={formatNumber(data?.average_rating, 2)} icon={Star} tone="warning" />
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
          {/* Progress */}
          <Card className="p-6">
            <h2 className="text-[15px] font-bold">تقدّم التقييم</h2>
            <p className="mt-0.5 text-xs text-fg-muted">نسبة المشاركات التي تم تقييمها</p>
            <div className="mt-6 flex items-center gap-6">
              {loading ? <Skeleton className="h-[132px] w-[132px] !rounded-full" /> : <ProgressRing percent={percent} label={`${percent}%`} sublabel="مكتمل" />}
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-primary" /> تم تقييمها <b dir="ltr">{formatNumber(evaluated)}</b></li>
                <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-line" /> بانتظار التقييم <b dir="ltr">{formatNumber(data?.pending_submissions)}</b></li>
              </ul>
            </div>
          </Card>

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
