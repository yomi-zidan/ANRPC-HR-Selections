"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, ClipboardList, Clock, Eye, FilePlus2, FileSpreadsheet, Filter, RefreshCw, Search, Star, X,
} from "lucide-react";
import {
  Alert, Avatar, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Pagination, Select, Skeleton, StatCard,
} from "@/components/ui";
import { downloadBlob, formatDate, isTeam, toCSV, typeLabel } from "@/lib/format";
import { getHRSubmissions } from "@/services/hrService";

const PAGE_SIZE = 10;
const initialFilters = { search: "", department: "", type: "", evaluation: "" };

const sorters = {
  newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  oldest: (a, b) => new Date(a.created_at) - new Date(b.created_at),
  rating: (a, b) => Number(b.average_rating) - Number(a.average_rating),
  name: (a, b) => String(a.employee_name).localeCompare(String(b.employee_name), "ar"),
};

const EvaluationBadge = ({ evaluated }) =>
  evaluated ? <Badge tone="success" icon={CheckCircle2}>تم التقييم</Badge> : <Badge tone="warning" icon={Clock}>بانتظار التقييم</Badge>;

const Rating = ({ item }) =>
  Number(item.review_count) > 0 ? (
    <span className="inline-flex items-center gap-1 font-bold text-warning-fg" dir="ltr">
      <Star size={14} className="fill-current" /> {Number(item.average_rating).toFixed(2)}
    </span>
  ) : (
    <span className="text-fg-subtle">—</span>
  );

export default function HRSubmissionsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ submissions: [], departments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    // debounce typing in the search box
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const result = await getHRSubmissions(filters, controller.signal);
        setData(result);
        setPage(1);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "تعذر تحميل المشاركات.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters, refreshKey]);

  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  const hasFilters = Object.values(filters).some(Boolean);

  const sorted = useMemo(() => [...data.submissions].sort(sorters[sort]), [data.submissions, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const evaluatedCount = data.submissions.filter((item) => Number(item.review_count) > 0).length;
  const pendingCount = data.submissions.length - evaluatedCount;

  function exportCSV() {
    const csv = toCSV(sorted, [
      { label: "رقم المشاركة", value: (r) => r.id },
      { label: "الرقم الوظيفي", value: (r) => r.empn },
      { label: "الموظف", value: (r) => r.employee_name },
      { label: "العنوان", value: (r) => r.title },
      { label: "الإدارة", value: (r) => r.department_name },
      { label: "النوع", value: (r) => typeLabel(r.submission_type) },
      { label: "الموقع", value: (r) => r.location },
      { label: "تاريخ التقديم", value: (r) => formatDate(r.created_at) },
      { label: "حالة التقييم", value: (r) => (Number(r.review_count) > 0 ? "تم التقييم" : "بانتظار التقييم") },
      { label: "متوسط التقييم", value: (r) => (Number(r.review_count) > 0 ? Number(r.average_rating).toFixed(2) : "") },
    ]);
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `submissions-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="إدارة المشاركات"
        subtitle="استعراض ومتابعة جميع المشاركات المقدمة في المسابقة"
        actions={
          <>
            <Button href="/hr/submissions/new" variant="accent" icon={FilePlus2}>إضافة مشاركة لموظف</Button>
            <Button variant="outline" icon={FileSpreadsheet} onClick={exportCSV} disabled={!sorted.length}>تصدير CSV</Button>
            <Button icon={RefreshCw} onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}>تحديث</Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard loading={loading} title="إجمالي المشاركات" value={data.submissions.length} icon={ClipboardList} />
        <StatCard loading={loading} title="تم تقييمها" value={evaluatedCount} icon={CheckCircle2} tone="success" />
        <StatCard loading={loading} title="بانتظار التقييم" value={pendingCount} icon={Clock} tone="warning" />
      </div>

      {/* Filters */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold"><Filter size={17} className="text-primary" /> البحث والتصفية</h2>
          {hasFilters && (
            <button type="button" onClick={() => setFilters(initialFilters)} className="inline-flex items-center gap-1 text-xs font-bold text-fg-muted hover:text-danger-fg">
              <X size={14} /> مسح الفلاتر
            </button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[2fr_1.4fr_1fr_1fr_1fr]">
          <Field label="بحث">
            <Input icon={Search} value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} placeholder="اسم الموظف، الرقم الوظيفي، العنوان..." />
          </Field>
          <Field label="الإدارة">
            <Select value={filters.department} onChange={(e) => updateFilter("department", e.target.value)}>
              <option value="">كل الإدارات</option>
              {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="نوع المشاركة">
            <Select value={filters.type} onChange={(e) => updateFilter("type", e.target.value)}>
              <option value="">كل الأنواع</option>
              <option value="1">فردية</option>
              <option value="2">جماعية</option>
            </Select>
          </Field>
          <Field label="حالة التقييم">
            <Select value={filters.evaluation} onChange={(e) => updateFilter("evaluation", e.target.value)}>
              <option value="">كل الحالات</option>
              <option value="evaluated">تم التقييم</option>
              <option value="pending">بانتظار التقييم</option>
            </Select>
          </Field>
          <Field label="الترتيب">
            <Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">الأحدث أولًا</option>
              <option value="oldest">الأقدم أولًا</option>
              <option value="rating">الأعلى تقييمًا</option>
              <option value="name">اسم الموظف</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Alert tone="danger" className="mb-6">{error}</Alert>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[15px] font-bold">قائمة المشاركات</h2>
            <p className="mt-0.5 text-xs text-fg-muted">المشاركات المسجلة في قاعدة البيانات</p>
          </div>
          <Badge tone="primary">{loading ? "..." : `${sorted.length} مشاركة`}</Badge>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : sorted.length === 0 ? (
          <EmptyState icon={ClipboardList} title="لا توجد مشاركات مطابقة" text="جرّب تغيير كلمات البحث أو الفلاتر." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto scroll-thin md:block">
              <table className="w-full min-w-[980px]">
                <thead className="border-b border-line bg-surface-2/60 text-xs font-bold text-fg-muted">
                  <tr>
                    {["الموظف", "عنوان المشاركة", "الإدارة", "النوع", "تاريخ التقديم", "التقييم", "المتوسط", ""].map((h, i) => (
                      <th key={i} className={`px-5 py-3.5 ${i >= 6 ? "text-center" : "text-start"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((item) => (
                    <tr key={item.id} className="transition hover:bg-surface-2/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={item.employee_name} size={36} />
                          <div>
                            <p className="text-sm font-bold">{item.employee_name || "—"}</p>
                            <p className="mt-0.5 text-xs text-fg-subtle">الرقم الوظيفي: {item.empn ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[260px] px-5 py-4">
                        <Link href={`/hr/submissions/${item.id}`} className="block truncate text-sm font-bold text-primary hover:underline">{item.title || "—"}</Link>
                        {item.location && <p className="mt-0.5 truncate text-xs text-fg-subtle">{item.location}</p>}
                      </td>
                      <td className="px-5 py-4 text-sm text-fg-muted">{item.department_name || "—"}</td>
                      <td className="px-5 py-4"><Badge tone={isTeam(item.submission_type) ? "info" : "primary"}>{isTeam(item.submission_type) ? "جماعية" : "فردية"}</Badge></td>
                      <td className="px-5 py-4 text-sm text-fg-muted">{formatDate(item.created_at, { year: "numeric", month: "short", day: "numeric" })}</td>
                      <td className="px-5 py-4"><EvaluationBadge evaluated={Number(item.review_count) > 0} /></td>
                      <td className="px-5 py-4 text-center"><Rating item={item} /></td>
                      <td className="px-5 py-4 text-center">
                        <Button href={`/hr/submissions/${item.id}`} variant="soft" size="icon" className="!h-9 !w-9" aria-label="عرض التفاصيل" title="عرض التفاصيل"><Eye size={17} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((item) => (
                <li key={item.id}>
                  <Link href={`/hr/submissions/${item.id}`} className="block space-y-3 p-4 active:bg-surface-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={item.employee_name} size={38} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{item.title}</p>
                          <p className="mt-0.5 truncate text-xs text-fg-muted">{item.employee_name} · {item.department_name || "—"}</p>
                        </div>
                      </div>
                      <Rating item={item} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <EvaluationBadge evaluated={Number(item.review_count) > 0} />
                      <Badge tone={isTeam(item.submission_type) ? "info" : "primary"}>{isTeam(item.submission_type) ? "جماعية" : "فردية"}</Badge>
                      <span className="text-xs text-fg-subtle">{formatDate(item.created_at, { day: "numeric", month: "short" })}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <Pagination page={page} pageCount={pageCount} onChange={setPage} total={sorted.length} pageSize={PAGE_SIZE} />
          </>
        )}
      </Card>
    </div>
  );
}
