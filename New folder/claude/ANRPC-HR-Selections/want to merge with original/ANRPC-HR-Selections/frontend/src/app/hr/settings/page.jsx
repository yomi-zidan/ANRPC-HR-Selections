"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, FolderOpen, HardDrive, RefreshCw, Save, Settings } from "lucide-react";
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, PageHeader, Skeleton, Switch } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { contestState } from "@/lib/format";
import { getHRSettings, updateContest, updateStorage } from "@/services/hrService";

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function HRSettingsPage() {
  const toast = useToast();
  const [contest, setContest] = useState(null);
  const [storage, setStorage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingContest, setSavingContest] = useState(false);
  const [savingStorage, setSavingStorage] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getHRSettings();
      setContest(
        data.contest
          ? { ...data.contest, OpenDate: toDateInput(data.contest.OpenDate), DeadlineDate: toDateInput(data.contest.DeadlineDate), IsActive: Boolean(data.contest.IsActive) }
          : null
      );
      setStorage((data.storage || []).map((item) => ({ ...item, IsActive: Boolean(item.IsActive) })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setContestField = (field, value) => setContest((current) => ({ ...current, [field]: value }));
  const setStorageField = (id, field, value) =>
    setStorage((current) => current.map((item) => (item.Id === id ? { ...item, [field]: value } : item)));

  async function saveContest(event) {
    event.preventDefault();
    try {
      setSavingContest(true);
      await updateContest({
        Id: Number(contest.Id),
        ContestName: contest.ContestName,
        OpenDate: contest.OpenDate,
        DeadlineDate: contest.DeadlineDate,
        IsActive: Boolean(contest.IsActive),
      });
      toast.success("تم حفظ إعدادات المسابقة بنجاح.");
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingContest(false);
    }
  }

  async function saveStorage(item) {
    try {
      setSavingStorage(item.Id);
      await updateStorage(item.Id, { Name: item.Name, BasePath: item.BasePath, IsActive: Boolean(item.IsActive) });
      toast.success(`تم حفظ إعدادات ${item.Name} بنجاح.`);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingStorage(null);
    }
  }

  const state = contestState(contest);

  return (
    <div className="mx-auto max-w-4xl animate-fade-up">
      <PageHeader
        title="إعدادات النظام"
        subtitle="إدارة إعدادات المسابقة ومسارات تخزين الملفات"
        actions={<Button variant="outline" icon={RefreshCw} onClick={load} disabled={loading}>تحديث</Button>}
      />

      <Alert tone="danger" className="mb-6">{error}</Alert>

      {loading ? (
        <div className="space-y-6"><Skeleton className="h-80 w-full" /><Skeleton className="h-64 w-full" /></div>
      ) : (
        <div className="space-y-6">
          {/* Contest */}
          <Card>
            <CardHeader
              icon={Settings}
              title="إعدادات المسابقة"
              subtitle="بيانات المسابقة ومواعيد التقديم"
              action={contest && <Badge tone={state.tone}>{state.label}</Badge>}
            />
            {contest ? (
              <form onSubmit={saveContest} className="space-y-6 p-6">
                <Field label="اسم المسابقة" required htmlFor="contest-name">
                  <Input id="contest-name" value={contest.ContestName || ""} onChange={(e) => setContestField("ContestName", e.target.value)} required maxLength={200} />
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="تاريخ فتح التقديم" required htmlFor="open-date">
                    <Input id="open-date" type="date" icon={CalendarDays} value={contest.OpenDate || ""} onChange={(e) => setContestField("OpenDate", e.target.value)} required />
                  </Field>
                  <Field label="الموعد النهائي للتقديم" required htmlFor="deadline" hint={state.key === "open" && state.daysLeft >= 0 ? `متبقي ${state.daysLeft} يوم على إغلاق التقديم` : undefined}>
                    <Input id="deadline" type="date" icon={CalendarDays} value={contest.DeadlineDate || ""} min={contest.OpenDate || undefined} onChange={(e) => setContestField("DeadlineDate", e.target.value)} required />
                  </Field>
                </div>

                <div className="rounded-xl bg-surface-2 p-4">
                  <Switch checked={Boolean(contest.IsActive)} onChange={(v) => setContestField("IsActive", v)} label="المسابقة مفعّلة" description="عند التعطيل لن يتمكن الموظفون من تقديم مشاركات جديدة" />
                </div>

                <div className="flex justify-end border-t border-line pt-5">
                  <Button type="submit" icon={Save} loading={savingContest}>{savingContest ? "جاري الحفظ..." : "حفظ إعدادات المسابقة"}</Button>
                </div>
              </form>
            ) : (
              <EmptyState icon={Settings} title="لا توجد إعدادات مسابقة مسجلة" text="لم يتم العثور على إعدادات المسابقة في قاعدة البيانات." />
            )}
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader icon={HardDrive} title="إعدادات تخزين الملفات" subtitle="تحديد مسارات حفظ مرفقات المشاركات" />
            {storage.length === 0 ? (
              <EmptyState icon={HardDrive} title="لا توجد إعدادات تخزين مسجلة" />
            ) : (
              <div className="divide-y divide-line">
                {storage.map((item) => (
                  <div key={item.Id} className="space-y-5 p-6">
                    <h3 className="flex items-center gap-2.5 text-sm font-bold"><FolderOpen size={18} className="text-primary" />{item.Name}</h3>

                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="اسم التخزين" htmlFor={`storage-name-${item.Id}`}>
                        <Input id={`storage-name-${item.Id}`} value={item.Name || ""} maxLength={50} onChange={(e) => setStorageField(item.Id, "Name", e.target.value)} />
                      </Field>
                      <Field label="مسار التخزين" htmlFor={`storage-path-${item.Id}`}>
                        <Input id={`storage-path-${item.Id}`} value={item.BasePath || ""} maxLength={500} dir="ltr" className="text-start" onChange={(e) => setStorageField(item.Id, "BasePath", e.target.value)} />
                      </Field>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-60"><Switch checked={Boolean(item.IsActive)} onChange={(v) => setStorageField(item.Id, "IsActive", v)} label="مسار التخزين نشط" /></div>
                      <Button variant="soft" icon={Save} loading={savingStorage === item.Id} onClick={() => saveStorage(item)}>
                        {savingStorage === item.Id ? "جاري الحفظ..." : "حفظ مسار التخزين"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
