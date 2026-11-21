"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Crown, RefreshCw, Trophy, Users } from "lucide-react";
import { Avatar, Button, Card, EmptyState, ErrorState, PageHeader, Segmented, Skeleton, Stars, StatCard, cx } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { getHRRanking } from "@/services/hrService";

const tabs = [
  { value: "employees", label: "ترتيب الموظفين", icon: Users },
  { value: "departments", label: "ترتيب الإدارات", icon: Building2 },
];

const podiumStyles = [
  { order: "sm:order-2", height: "sm:h-44", ring: "ring-accent", badge: "bg-accent text-accent-fg", label: "1" },
  { order: "sm:order-1", height: "sm:h-32", ring: "ring-slate-300 dark:ring-slate-500", badge: "bg-slate-300 text-slate-800", label: "2" },
  { order: "sm:order-3", height: "sm:h-24", ring: "ring-orange-300", badge: "bg-orange-300 text-orange-950", label: "3" },
];

export default function HRRankingPage() {
  const [data, setData] = useState({ employees: [], departments: [] });
  const [tab, setTab] = useState("employees");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setData(await getHRRanking());
    } catch (err) {
      setError(err.message || "تعذر تحميل الترتيب.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(
    () =>
      (tab === "employees" ? data.employees : data.departments).map((item) => ({
        key: tab === "employees" ? item.empn : item.department_id,
        name: tab === "employees" ? item.employee_name : item.department_name,
        sub: tab === "employees" ? item.department_name || "—" : null,
        count: Number(item.evaluated_submissions),
        rating: Number(item.average_rating),
      })),
    [data, tab]
  );

  const top = rows.slice(0, 3);

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="الترتيب والتقييم"
        subtitle="ترتيب الموظفين والإدارات بناءً على متوسط التقييمات المسجلة"
        actions={<Button icon={RefreshCw} onClick={load} disabled={loading}>تحديث الترتيب</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard loading={loading} title="موظفون لديهم تقييمات" value={data.employees.length} icon={Users} />
        <StatCard loading={loading} title="إدارات لديها تقييمات" value={data.departments.length} icon={Building2} tone="info" />
      </div>

      <Segmented options={tabs} value={tab} onChange={setTab} className="mb-6 w-full sm:w-auto" />

      {loading ? (
        <div className="space-y-4"><Skeleton className="h-56 w-full" /><Skeleton className="h-72 w-full" /></div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={Trophy} title="لا توجد تقييمات مسجلة حتى الآن" text="ستظهر النتائج هنا بعد تقييم المشاركات." /></Card>
      ) : (
        <>
          {/* Podium */}
          <Card className="relative mb-6 overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -top-24 start-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
            <div className="relative mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-warning-fg"><Trophy size={22} /></span>
              <div>
                <h2 className="text-lg font-bold">المراكز الأولى</h2>
                <p className="text-xs text-fg-muted">الأعلى في متوسط التقييم</p>
              </div>
            </div>

            <div className="relative grid items-end gap-4 sm:grid-cols-3">
              {top.map((item, index) => {
                const style = podiumStyles[index];
                return (
                  <div key={item.key} className={cx("flex flex-col", style.order)}>
                    <div className="mb-3 flex flex-col items-center text-center">
                      <div className="relative">
                        {index === 0 && <Crown size={26} className="absolute -top-7 left-1/2 -translate-x-1/2 fill-accent text-accent" />}
                        <Avatar name={item.name} size={index === 0 ? 72 : 60} className={cx("ring-4", style.ring)} />
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm font-bold">{item.name}</p>
                      {item.sub && <p className="mt-0.5 line-clamp-1 text-xs text-fg-muted">{item.sub}</p>}
                      <Stars value={item.rating} readOnly size={14} className="mt-2" />
                      <p className="mt-1 text-sm font-extrabold text-warning-fg" dir="ltr">{item.rating.toFixed(2)}</p>
                    </div>
                    <div className={cx("flex items-start justify-center rounded-t-2xl bg-primary-soft pt-3", style.height, "h-20")}>
                      <span className={cx("flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold", style.badge)}>{style.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Full list */}
          <Card className="overflow-hidden">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-[15px] font-bold">{tab === "employees" ? "ترتيب الموظفين" : "ترتيب الإدارات"}</h2>
              <p className="mt-0.5 text-xs text-fg-muted">ترتيب تنازلي حسب متوسط التقييم</p>
            </div>
            <ol className="divide-y divide-line">
              {rows.map((item, index) => (
                <li key={item.key} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-surface-2/50 sm:px-6">
                  <span className={cx(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
                    index === 0 ? "bg-accent text-accent-fg" : index < 3 ? "bg-primary-soft text-primary" : "bg-surface-2 text-fg-muted"
                  )}>{index + 1}</span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.name}</p>
                    {item.sub && <p className="mt-0.5 truncate text-xs text-fg-muted">{item.sub}</p>}
                  </div>

                  <div className="hidden w-40 sm:block">
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(item.rating / 5) * 100}%` }} />
                    </div>
                  </div>

                  <span className="text-xs text-fg-muted">{formatNumber(item.count)} مشاركة مقيّمة</span>
                  <span className="min-w-16 text-end text-sm font-extrabold text-warning-fg" dir="ltr">★ {item.rating.toFixed(2)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
