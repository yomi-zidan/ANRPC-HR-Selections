"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Pencil, Plus, RefreshCw, Save, SlidersHorizontal } from "lucide-react";
import {
  Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Skeleton, StatCard, Switch,
} from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { createCriterion, getCriteria, updateCriterion } from "@/services/hrService";

const emptyForm = { Id: null, NameAr: "", SortOrder: 1, IsActive: true };

export default function HRCriteriaPage() {
  const toast = useToast();
  const [criteria, setCriteria] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setCriteria(await getCriteria());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ordered = useMemo(
    () => [...criteria].sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder) || a.Id - b.Id),
    [criteria]
  );
  const activeCount = criteria.filter((c) => Boolean(c.IsActive)).length;

  const payloadOf = (item, patch = {}) => ({
    NameAr: item.NameAr,
    SortOrder: Number(item.SortOrder),
    IsActive: Boolean(item.IsActive),
    ...patch,
  });

  function openAdd() {
    setForm({ ...emptyForm, SortOrder: ordered.length + 1 });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item) {
    setForm({ Id: item.Id, NameAr: item.NameAr, SortOrder: item.SortOrder, IsActive: Boolean(item.IsActive) });
    setFormError("");
    setModalOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    if (!form.NameAr.trim()) return setFormError("من فضلك أدخل اسم المعيار.");

    try {
      setSaving(true);
      setFormError("");
      const payload = { NameAr: form.NameAr.trim(), SortOrder: Number(form.SortOrder), IsActive: Boolean(form.IsActive) };
      if (form.Id) await updateCriterion(form.Id, payload);
      else await createCriterion(payload);
      toast.success(form.Id ? "تم تحديث المعيار بنجاح." : "تمت إضافة المعيار بنجاح.");
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(item) {
    try {
      setBusyId(item.Id);
      await updateCriterion(item.Id, payloadOf(item, { IsActive: !item.IsActive }));
      toast.success(item.IsActive ? "تم تعطيل المعيار." : "تم تفعيل المعيار.");
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;

    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];

    // Renumber 1..n; only send the rows whose order actually changed.
    const changed = next
      .map((item, i) => ({ item, order: i + 1 }))
      .filter(({ item, order }) => Number(item.SortOrder) !== order);

    try {
      setBusyId(ordered[index].Id);
      await Promise.all(changed.map(({ item, order }) => updateCriterion(item.Id, payloadOf(item, { SortOrder: order }))));
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="إدارة معايير التقييم"
        subtitle="التحكم في المعايير التي يختارها الموظف عند تقديم المشاركة"
        actions={
          <>
            <Button variant="outline" icon={RefreshCw} onClick={load} disabled={loading}>تحديث</Button>
            <Button icon={Plus} onClick={openAdd}>إضافة معيار</Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard loading={loading} title="إجمالي المعايير" value={criteria.length} icon={SlidersHorizontal} />
        <StatCard loading={loading} title="المعايير النشطة" value={activeCount} icon={CheckCircle2} tone="success" />
      </div>

      <Alert tone="danger" className="mb-6">{error}</Alert>

      <Card className="overflow-hidden">
        <CardHeader icon={SlidersHorizontal} title="معايير المسابقة" subtitle="تظهر بالترتيب المحدد — استخدم الأسهم لإعادة الترتيب" />

        {loading ? (
          <div className="space-y-3 p-6">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : ordered.length === 0 ? (
          <EmptyState icon={SlidersHorizontal} title="لا توجد معايير مسجلة" action={<Button icon={Plus} onClick={openAdd}>إضافة معيار</Button>} />
        ) : (
          <ul className="divide-y divide-line">
            {ordered.map((item, index) => (
              <li key={item.Id} className={`flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-surface-2/50 sm:px-6 ${item.IsActive ? "" : "opacity-60"}`}>
                <div className="flex flex-col">
                  <button type="button" disabled={index === 0 || busyId !== null} onClick={() => move(index, -1)} aria-label="نقل لأعلى" className="rounded-md p-0.5 text-fg-subtle hover:bg-surface-2 hover:text-primary disabled:opacity-30"><ArrowUp size={16} /></button>
                  <button type="button" disabled={index === ordered.length - 1 || busyId !== null} onClick={() => move(index, 1)} aria-label="نقل لأسفل" className="rounded-md p-0.5 text-fg-subtle hover:bg-surface-2 hover:text-primary disabled:opacity-30"><ArrowDown size={16} /></button>
                </div>

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-sm font-extrabold text-primary">{index + 1}</span>

                <p className="min-w-0 flex-1 text-sm font-bold leading-6">{item.NameAr}</p>

                <Badge tone={item.IsActive ? "success" : "neutral"}>{item.IsActive ? "نشط" : "غير نشط"}</Badge>

                <div className="flex items-center gap-3">
                  <Switch checked={Boolean(item.IsActive)} onChange={() => toggle(item)} disabled={busyId === item.Id} label="" />
                  <Button variant="soft" size="icon" className="!h-9 !w-9" onClick={() => openEdit(item)} aria-label="تعديل" title="تعديل"><Pencil size={16} /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.Id ? "تعديل المعيار" : "إضافة معيار جديد"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button type="submit" form="criterion-form" icon={Save} loading={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </>
        }
      >
        <form id="criterion-form" onSubmit={save} className="space-y-5 p-6">
          <Alert tone="danger">{formError}</Alert>
          <Field label="اسم المعيار" required htmlFor="criterion-name">
            <Input id="criterion-name" autoFocus value={form.NameAr} maxLength={200} placeholder="اكتب اسم المعيار" onChange={(e) => setForm({ ...form, NameAr: e.target.value })} />
          </Field>
          <Field label="ترتيب العرض" htmlFor="criterion-order">
            <Input id="criterion-order" type="number" min="0" value={form.SortOrder} onChange={(e) => setForm({ ...form, SortOrder: e.target.value })} dir="ltr" className="text-start" />
          </Field>
          <div className="rounded-xl bg-surface-2 p-4">
            <Switch checked={form.IsActive} onChange={(value) => setForm({ ...form, IsActive: value })} label="المعيار نشط" description="المعايير النشطة فقط تظهر للموظفين عند التقديم" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
