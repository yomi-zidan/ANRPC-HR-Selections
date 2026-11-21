"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, FolderOpen, HardDrive, KeyRound, RefreshCw, Save, Search, Settings, UserPlus, UsersRound } from "lucide-react";
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, PageHeader, Skeleton, Switch } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { contestState } from "@/lib/format";
import { createHRUser, getHRSettings, getHRUsers, lookupHREmployee, updateContest, updateHRPassword, updateStorage } from "@/services/hrService";

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toBoolean(value) {
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
}

export default function HRSettingsPage() {
  const toast = useToast();
  const [contest, setContest] = useState(null);
  const [storage, setStorage] = useState([]);
  const [users, setUsers] = useState([]);
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [employee, setEmployee] = useState(null);
  const [newUser, setNewUser] = useState({ username: "", password: "", password_confirmation: "" });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [loading, setLoading] = useState(true);
  const [savingContest, setSavingContest] = useState(false);
  const [savingStorage, setSavingStorage] = useState(null);
  const [savingUser, setSavingUser] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [lookingUpEmployee, setLookingUpEmployee] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [data, hrUsers] = await Promise.all([getHRSettings(), getHRUsers()]);
      setContest(
        data.contest
          ? { ...data.contest, OpenDate: toDateInput(data.contest.OpenDate), DeadlineDate: toDateInput(data.contest.DeadlineDate), IsActive: toBoolean(data.contest.IsActive) }
          : null
      );
      setStorage((data.storage || []).map((item) => ({ ...item, IsActive: toBoolean(item.IsActive) })));
      setUsers(hrUsers);
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
      const result = await updateContest({
        Id: Number(contest.Id),
        ContestName: contest.ContestName,
        OpenDate: contest.OpenDate,
        DeadlineDate: contest.DeadlineDate,
        IsActive: Boolean(contest.IsActive),
      });
      if (result.contest) {
        setContest({
          ...result.contest,
          OpenDate: toDateInput(result.contest.OpenDate),
          DeadlineDate: toDateInput(result.contest.DeadlineDate),
          IsActive: toBoolean(result.contest.IsActive),
        });
      } else {
        const latest = await getHRSettings();
        setContest({ ...latest.contest, OpenDate: toDateInput(latest.contest?.OpenDate), DeadlineDate: toDateInput(latest.contest?.DeadlineDate), IsActive: toBoolean(latest.contest?.IsActive) });
      }
      toast.success("تم حفظ إعدادات المسابقة بنجاح.");
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

  async function findEmployee() {
    if (!employeeNumber.trim()) {
      toast.error("أدخل رقم القيد أولاً.");
      return;
    }
    try {
      setLookingUpEmployee(true);
      const result = await lookupHREmployee(employeeNumber.trim());
      setEmployee(result.employee);
    } catch (err) {
      setEmployee(null);
      toast.error(err.message || "رقم القيد غير صحيح أو غير مسجل.");
    } finally {
      setLookingUpEmployee(false);
    }
  }

  async function addHRUser(event) {
    event.preventDefault();
    if (!employee) {
      toast.error("ابحث عن الموظف برقم القيد أولاً.");
      return;
    }
    try {
      setSavingUser(true);
      await createHRUser({ ...newUser, empn: Number(employee.empn) });
      toast.success("تم إنشاء حساب HR بنجاح.");
      setNewUser({ username: "", password: "", password_confirmation: "" });
      setEmployeeNumber("");
      setEmployee(null);
      setUsers(await getHRUsers());
    } catch (err) {
      toast.error(err.message || "تعذر إنشاء حساب HR.");
    } finally {
      setSavingUser(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    try {
      setSavingPassword(true);
      await updateHRPassword(passwordForm);
      toast.success("تم تغيير كلمة المرور بنجاح.");
      setPasswordForm({ current_password: "", password: "", password_confirmation: "" });
    } catch (err) {
      toast.error(err.message || "تعذر تغيير كلمة المرور.");
    } finally {
      setSavingPassword(false);
    }
  }

  const state = contestState(contest);

  return (
    <div className="mx-auto max-w-4xl animate-fade-up">
        <PageHeader
        title="إعدادات النظام"
        subtitle="إدارة إعدادات المسابقة وحسابات الموارد البشرية"
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

          {/* HR accounts */}
          <Card>
            <CardHeader icon={UsersRound} title="حسابات الموارد البشرية" subtitle="إضافة حساب جديد مرتبط بموظف مسجل في قاعدة البيانات" />
            <form onSubmit={addHRUser} className="space-y-5 p-6">
              <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
                <Field label="رقم القيد" required htmlFor="hr-user-empn">
                  <Input id="hr-user-empn" inputMode="numeric" value={employeeNumber} onBlur={() => { if (employeeNumber.trim() && !employee) findEmployee(); }} onChange={(event) => { setEmployeeNumber(event.target.value.replace(/\D/g, "")); setEmployee(null); }} placeholder="أدخل رقم القيد" />
                </Field>
                <Button type="button" variant="outline" icon={Search} loading={lookingUpEmployee} onClick={findEmployee}>التحقق من الموظف</Button>
              </div>
              {employee && <div className="grid gap-3 rounded-xl bg-primary-soft/60 p-4 sm:grid-cols-3"><div><p className="text-[11px] text-fg-muted">اسم الموظف</p><p className="mt-1 text-sm font-bold">{employee.ename}</p></div><div><p className="text-[11px] text-fg-muted">رقم القيد</p><p className="mt-1 text-sm font-bold" dir="ltr">{employee.empn}</p></div><div><p className="text-[11px] text-fg-muted">الإدارة</p><p className="mt-1 text-sm font-bold">{employee.edara_text || "—"}</p></div></div>}
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="اسم المستخدم" required htmlFor="new-hr-username"><Input id="new-hr-username" value={newUser.username} onChange={(event) => setNewUser((current) => ({ ...current, username: event.target.value }))} autoComplete="off" maxLength={50} required /></Field>
                <Field label="كلمة المرور" required htmlFor="new-hr-password" hint="8 أحرف على الأقل"><Input id="new-hr-password" type="password" value={newUser.password} onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))} autoComplete="new-password" minLength={8} required /></Field>
                <Field label="تأكيد كلمة المرور" required htmlFor="new-hr-password-confirm"><Input id="new-hr-password-confirm" type="password" value={newUser.password_confirmation} onChange={(event) => setNewUser((current) => ({ ...current, password_confirmation: event.target.value }))} autoComplete="new-password" minLength={8} required /></Field>
              </div>
              <div className="flex justify-end border-t border-line pt-5"><Button type="submit" icon={UserPlus} loading={savingUser}>إضافة مستخدم HR</Button></div>
            </form>
            <div className="border-t border-line">
              <div className="px-6 py-4"><h3 className="text-sm font-bold">المستخدمون المسجلون</h3></div>
              {users.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] table-fixed text-start">
                    <thead className="bg-surface-2 text-xs text-fg-muted">
                      <tr>
                        <th className="w-[40%] px-6 py-3 text-right font-semibold">اسم الموظف</th>
                        <th className="w-[30%] px-6 py-3 text-right font-semibold">اسم المستخدم</th>
                        <th className="w-[30%] px-6 py-3 text-right font-semibold">رقم القيد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {users.map((item) => (
                        <tr key={item.id_user}>
                          <td className="truncate px-6 py-3 text-right text-sm font-semibold" dir="rtl">{item.FullName || "—"}</td>
                          <td className="truncate px-6 py-3 text-right text-sm" dir="ltr">{item.Username}</td>
                          <td className="px-6 py-3 text-right text-sm text-fg-muted" dir="ltr">{item.empn || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState icon={UsersRound} title="لا يوجد مستخدمون مسجلون" className="py-8" />}
            </div>
          </Card>

          {/* Change password */}
          <Card>
            <CardHeader icon={KeyRound} title="تغيير كلمة المرور" subtitle="تغيير كلمة مرور حساب HR الحالي" />
            <form onSubmit={changePassword} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="كلمة المرور الحالية" required htmlFor="current-hr-password"><Input id="current-hr-password" type="password" value={passwordForm.current_password} onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))} autoComplete="current-password" required /></Field>
                <Field label="كلمة المرور الجديدة" required htmlFor="new-hr-password-self" hint="8 أحرف على الأقل"><Input id="new-hr-password-self" type="password" value={passwordForm.password} onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))} autoComplete="new-password" minLength={8} required /></Field>
                <Field label="تأكيد كلمة المرور الجديدة" required htmlFor="confirm-hr-password"><Input id="confirm-hr-password" type="password" value={passwordForm.password_confirmation} onChange={(event) => setPasswordForm((current) => ({ ...current, password_confirmation: event.target.value }))} autoComplete="new-password" minLength={8} required /></Field>
              </div>
              <div className="flex justify-end border-t border-line pt-5"><Button type="submit" icon={KeyRound} loading={savingPassword}>حفظ كلمة المرور</Button></div>
            </form>
          </Card>

        </div>
      )}
    </div>
  );
}
