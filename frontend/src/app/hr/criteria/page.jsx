
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  RefreshCw,
  Save,
  X,
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
  Power,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

async function criteriaRequest(url, options = {}) {
  const token = sessionStorage.getItem("hr_token");

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    cache: "no-store",
  });

  const result = await response.json();

  if (response.status === 401) {
    sessionStorage.removeItem("hr_token");
    sessionStorage.removeItem("hr_user");
    window.location.href = "/login";
    throw new Error("انتهت جلسة تسجيل الدخول.");
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || "حدث خطأ أثناء تنفيذ العملية.");
  }

  return result;
}

const emptyForm = {
  Id: null,
  NameAr: "",
  SortOrder: 1,
  IsActive: true,
};

export default function HRCriteriaPage() {
  const [criteria, setCriteria] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCriteria = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await criteriaRequest("/hr/criteria");
      setCriteria(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCriteria();
  }, [loadCriteria]);

  function openAdd() {
    setForm({
      ...emptyForm,
      SortOrder: criteria.length + 1,
    });
    setEditing(false);
    setShowForm(true);
    setMessage("");
    setError("");
  }

  function openEdit(item) {
    setForm({
      Id: item.Id,
      NameAr: item.NameAr,
      SortOrder: item.SortOrder,
      IsActive: Boolean(item.IsActive),
    });
    setEditing(true);
    setShowForm(true);
    setMessage("");
    setError("");
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!form.NameAr.trim()) {
      setError("من فضلك أدخلي اسم المعيار.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        NameAr: form.NameAr.trim(),
        SortOrder: Number(form.SortOrder),
        IsActive: Boolean(form.IsActive),
      };

      if (editing) {
        await criteriaRequest(`/hr/criteria/${form.Id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("تم تحديث المعيار بنجاح.");
      } else {
        await criteriaRequest("/hr/criteria", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("تمت إضافة المعيار بنجاح.");
      }

      setShowForm(false);
      await loadCriteria();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item) {
    try {
      setError("");
      setMessage("");

      await criteriaRequest(`/hr/criteria/${item.Id}`, {
        method: "PUT",
        body: JSON.stringify({
          NameAr: item.NameAr,
          SortOrder: Number(item.SortOrder),
          IsActive: !Boolean(item.IsActive),
        }),
      });

      setMessage("تم تحديث حالة المعيار.");
      await loadCriteria();
    } catch (err) {
      setError(err.message);
    }
  }

  const activeCount = criteria.filter((item) => Boolean(item.IsActive)).length;

  return (
    <div dir="rtl" className="mx-auto max-w-[1500px] space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#163B63]">
            إدارة معايير التقييم
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            التحكم في المعايير المستخدمة عند تقييم المشاركات
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadCriteria}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-4 py-3 text-sm text-[#163B63] hover:bg-slate-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            تحديث
          </button>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-[#163B63] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0D2B4B]"
          >
            <Plus size={18} />
            إضافة معيار
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#DCE4EF] bg-white p-5">
          <p className="text-sm text-slate-500">إجمالي المعايير</p>
          <p className="mt-3 text-3xl font-bold text-[#163B63]">
            {loading ? "—" : criteria.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#DCE4EF] bg-white p-5">
          <p className="text-sm text-slate-500">المعايير النشطة</p>
          <p className="mt-3 text-3xl font-bold text-green-700">
            {loading ? "—" : activeCount}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {showForm && (
        <section className="rounded-2xl border border-[#DCE4EF] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bold text-[#163B63]">
              {editing ? "تعديل المعيار" : "إضافة معيار جديد"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-600">
                اسم المعيار
              </label>
              <input
                value={form.NameAr}
                onChange={(e) =>
                  setForm({ ...form, NameAr: e.target.value })
                }
                required
                maxLength={200}
                placeholder="اكتبي اسم المعيار"
                className="h-11 w-full rounded-xl border border-[#DCE4EF] px-4 text-sm outline-none focus:border-[#163B63]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">
                ترتيب العرض
              </label>
              <input
                type="number"
                min="0"
                value={form.SortOrder}
                onChange={(e) =>
                  setForm({ ...form, SortOrder: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-[#DCE4EF] px-4 text-sm outline-none focus:border-[#163B63]"
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-600 md:col-span-3">
              <input
                type="checkbox"
                checked={form.IsActive}
                onChange={(e) =>
                  setForm({ ...form, IsActive: e.target.checked })
                }
                className="h-4 w-4 accent-[#163B63]"
              />
              المعيار نشط
            </label>

            <div className="flex gap-3 md:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#163B63] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0D2B4B] disabled:opacity-50"
              >
                <Save size={17} />
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm text-slate-600 hover:bg-slate-50"
              >
                إلغاء
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#DCE4EF] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#E8EDF4] px-6 py-5">
          <SlidersHorizontal size={21} className="text-[#163B63]" />
          <div>
            <h2 className="font-bold text-[#163B63]">معايير المسابقة</h2>
            <p className="mt-1 text-xs text-slate-500">
              يتم عرض المعايير حسب ترتيبها المحدد
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#163B63]">
            <RefreshCw size={22} className="mx-auto mb-3 animate-spin" />
            جاري تحميل المعايير...
          </div>
        ) : criteria.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            لا توجد معايير مسجلة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-right">
              <thead className="bg-[#F7F9FC] text-xs text-slate-500">
                <tr>
                  <th className="px-6 py-4">الترتيب</th>
                  <th className="px-6 py-4">اسم المعيار</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((item) => (
                  <tr
                    key={item.Id}
                    className="border-t border-[#EDF1F6] hover:bg-[#FAFBFD]"
                  >
                    <td className="px-6 py-5 text-sm text-slate-500">
                      {item.SortOrder}
                    </td>
                    <td className="px-6 py-5 font-semibold text-slate-700">
                      {item.NameAr}
                    </td>
                    <td className="px-6 py-5">
                      {Boolean(item.IsActive) ? (
                        <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                          نشط
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                          غير نشط
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          title="تعديل"
                          className="rounded-lg bg-blue-50 p-2.5 text-blue-700 hover:bg-blue-100"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => toggleActive(item)}
                          title={Boolean(item.IsActive) ? "تعطيل" : "تفعيل"}
                          className="rounded-lg bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200"
                        >
                          <Power size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
