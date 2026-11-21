"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, BarChart3, Building2, RefreshCw, Star, Users } from "lucide-react";
import { Avatar, Button, Card, CardHeader, EmptyState, ErrorState, PageHeader, Segmented, Skeleton, StatCard } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { getHRRanking } from "@/services/hrService";

function RankingList({ rows, kind, loading }) {
  if (loading) return <div className="space-y-3 p-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[72px] w-full" />)}</div>;
  if (!rows.length) return <EmptyState icon={BarChart3} title="لا توجد نتائج ترتيب حتى الآن" text="ستظهر النتائج هنا بعد تقييم المشاركات." />;
  const maxRating = Math.max(1, ...rows.map((row) => Number(row.average_rating || 0)));
  return <div className="divide-y divide-line">
    {rows.map((row, index) => {
      const title = kind === "employees" ? row.employee_name : row.department_name;
      const subtitle = kind === "employees" ? row.department_name : `${formatNumber(row.evaluated_submissions)} مشاركة تم تقييمها`;
      const rating = Number(row.average_rating || 0);
      return <div key={row.empn ?? row.department_id ?? title} className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[52px_minmax(0,1fr)_minmax(130px,220px)_76px] sm:gap-4 sm:px-6">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${index < 3 ? "bg-primary-soft text-primary" : "bg-surface-2 text-fg-muted"}`} dir="ltr">{String(index + 1).padStart(2, "0")}</span>
        <div className="flex min-w-0 items-center gap-3">
          {kind === "employees" ? <Avatar name={title || "موظف"} size={40} /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"><Building2 size={18} /></span>}
          <div className="min-w-0"><p className="truncate text-sm font-bold text-fg">{title || "—"}</p><p className="mt-1 truncate text-xs text-fg-muted">{subtitle || "—"}</p></div>
        </div>
        <div className="hidden sm:block"><div className="mb-1.5 flex justify-between text-[11px] text-fg-muted"><span>مستوى التقييم</span><span dir="ltr">{rating.toFixed(2)} / 5</span></div><div className="h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, rating / 5 * 100)}%` }} /></div></div>
        <div className="text-left"><span className="inline-flex items-center gap-1.5 rounded-lg bg-warning-bg px-2.5 py-1.5 text-sm font-bold text-warning-fg" dir="ltr"><Star size={14} className="fill-current" />{rating.toFixed(2)}</span></div>
      </div>;
    })}
  </div>;
}

export default function HRRankingPage() {
  const [kind, setKind] = useState("employees");
  const [data, setData] = useState({ employees: [], departments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const load = useCallback(async () => {
    try { setLoading(true); setError(""); setData(await getHRRanking()); }
    catch (err) { setError(err.message || "تعذر تحميل الترتيب."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);
  const rows = data[kind] || [];
  const best = useMemo(() => rows[0], [rows]);
  return <div className="space-y-6">
    <PageHeader title="الترتيب" subtitle="نتائج تقييم المشاركات على مستوى الموظفين والإدارات." actions={<Button variant="outline" icon={RefreshCw} onClick={() => setRefreshKey((v) => v + 1)}>تحديث</Button>} />
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard title="الموظفون في الترتيب" value={loading ? "—" : formatNumber(data.employees.length)} icon={Users} hint="الموظفون أصحاب المشاركات المُقيّمة" />
      <StatCard title="الإدارات في الترتيب" value={loading ? "—" : formatNumber(data.departments.length)} icon={Building2} hint="مقارنة متوسطات التقييم بين الإدارات" />
    </div>
    {error ? <ErrorState message={error} onRetry={load} /> : <Card className="overflow-hidden">
      <CardHeader icon={Award} title="نتائج التقييم" subtitle="الترتيب تنازليًا حسب متوسط التقييم" />
      <div className="border-b border-line px-4 py-3 sm:px-6"><Segmented value={kind} onChange={setKind} options={[{ value: "employees", label: "الموظفون" }, { value: "departments", label: "الإدارات" }]} /></div>
      {!loading && rows.length > 0 && <div className="hidden grid-cols-[52px_minmax(0,1fr)_minmax(130px,220px)_76px] gap-4 bg-surface-2/60 px-6 py-3 text-xs font-semibold text-fg-muted sm:grid"><span>المركز</span><span>{kind === "employees" ? "الموظف" : "الإدارة"}</span><span>مؤشر التقييم</span><span className="text-left">المتوسط</span></div>}
      <RankingList rows={rows} kind={kind} loading={loading} />
    </Card>}
  </div>;
}
