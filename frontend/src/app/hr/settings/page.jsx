
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  Save,
  Settings,
  CalendarDays,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  HardDrive,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

async function settingsRequest(url, options = {}) {
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

function toDateInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function HRSettingsPage() {
  const [contest, setContest] = useState(null);
  const [storage, setStorage] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingContest, setSavingContest] = useState(false);
  const [savingStorage, setSavingStorage] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await settingsRequest("/hr/settings");

      setContest(
        result.data.contest
          ? {
              ...result.data.contest,
              OpenDate: toDateInput(result.data.contest.OpenDate),
              DeadlineDate: toDateInput(result.data.contest.DeadlineDate),
              IsActive: Boolean(result.data.contest.IsActive),
            }
          : null
      );

      setStorage(
        (result.data.storage || []).map((item) => ({
          ...item,
          IsActive: Boolean(item.IsActive),
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function updateContest(field, value) {
    setContest((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateStorageField(id, field, value) {
    setStorage((current) =>
      current.map((item) =>
        item.Id === id ? { ...item, [field]: value } : item
      )
    );
  }

  async function saveContest(e) {
    e.preventDefault();

    try {
      setSavingContest(true);
      setError("");
      setMessage("");

      await settingsRequest("/hr/settings/contest", {
        method: "PUT",
        body: JSON.stringify({
          Id: Number(contest.Id),
          ContestName: contest.ContestName,
          OpenDate: contest.OpenDate,
          DeadlineDate: contest.DeadlineDate,
          IsActive: Boolean(contest.IsActive),
        }),
      });

      setMessage("تم حفظ إعدادات المسابقة بنجاح.");
      await loadSettings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingContest(false);
    }
  }

  async function saveStorage(item) {
    try {
      setSavingStorage(item.Id);
      setError("");
      setMessage("");

      await settingsRequest(`/hr/settings/storage/${item.Id}`, {
        method: "PUT",
        body: JSON.stringify({
          Name: item.Name,
          BasePath: item.BasePath,
          IsActive: Boolean(item.IsActive),
        }),
      });

      setMessage(`تم حفظ إعدادات ${item.Name} بنجاح.`);
      await loadSettings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingStorage(null);
    }
  }

  return (
    <div dir="rtl" className="mx-auto max-w-[1450px] space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#163B63]">
            إعدادات النظام
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            إدارة إعدادات المسابقة ومسارات تخزين الملفات
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-[#DCE4EF] bg-white px-5 py-3 text-sm text-[#163B63] hover:bg-slate-50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          تحديث
        </button>
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

      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 text-[#163B63]">
          <RefreshCw size={22} className="animate-spin" />
          جاري تحميل الإعدادات...
        </div>
      ) : (
        <>
          {/* Contest Settings */}
          <section className="overflow-hidden rounded-2xl border border-[#DCE4EF] bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#E8EDF4] px-6 py-5">
              <div className="rounded-xl bg-blue-50 p-3 text-[#163B63]">
                <Settings size={22} />
              </div>
              <div>
                <h2 className="font-bold text-[#163B63]">
                  إعدادات المسابقة
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  بيانات المسابقة ومواعيد التقديم
                </p>
              </div>
            </div>

            {contest ? (
              <form onSubmit={saveContest} className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-600">
                      اسم المسابقة
                    </label>
                    <input
                      value={contest.ContestName || ""}
                      onChange={(e) =>
                        updateContest("ContestName", e.target.value)
                      }
                      required
                      maxLength={200}
                      className="h-12 w-full rounded-xl border border-[#DCE4EF] px-4 text-sm outline-none focus:border-[#163B63]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <CalendarDays size={17} />
                      تاريخ فتح التقديم
                    </label>
                    <input
                      type="date"
                      value={contest.OpenDate || ""}
                      onChange={(e) =>
                        updateContest("OpenDate", e.target.value)
                      }
                      required
                      className="h-12 w-full rounded-xl border border-[#DCE4EF] px-4 text-sm outline-none focus:border-[#163B63]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <CalendarDays size={17} />
                      الموعد النهائي للتقديم
                    </label>
                    <input
                      type="date"
                      value={contest.DeadlineDate || ""}
                      min={contest.OpenDate || undefined}
                      onChange={(e) =>
                        updateContest("DeadlineDate", e.target.value)
                      }
                      required
                      className="h-12 w-full rounded-xl border border-[#DCE4EF] px-4 text-sm outline-none focus:border-[#163B63]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-xl bg-[#F7F9FC] p-4 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(contest.IsActive)}
                    onChange={(e) =>
                      updateContest("IsActive", e.target.checked)
                    }
                    className="h-4 w-4 accent-[#163B63]"
                  />
                  المسابقة مفعّلة
                </label>

                <div className="flex justify-end border-t border-[#EDF1F6] pt-5">
                  <button
                    type="submit"
                    disabled={savingContest}
                    className="flex items-center gap-2 rounded-xl bg-[#163B63] px-7 py-3 text-sm font-semibold text-white hover:bg-[#0D2B4B] disabled:opacity-50"
                  >
                    <Save size={17} />
                    {savingContest ? "جاري الحفظ..." : "حفظ إعدادات المسابقة"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                لا توجد إعدادات مسابقة مسجلة في قاعدة البيانات.
              </div>
            )}
          </section>

          {/* Storage Settings */}
          <section className="overflow-hidden rounded-2xl border border-[#DCE4EF] bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#E8EDF4] px-6 py-5">
              <div className="rounded-xl bg-blue-50 p-3 text-[#163B63]">
                <HardDrive size={22} />
              </div>
              <div>
                <h2 className="font-bold text-[#163B63]">
                  إعدادات تخزين الملفات
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  تحديد مسارات حفظ مرفقات المشاركات
                </p>
              </div>
            </div>

            {storage.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                لا توجد إعدادات تخزين مسجلة.
              </div>
            ) : (
              <div className="divide-y divide-[#EDF1F6]">
                {storage.map((item) => (
                  <div key={item.Id} className="space-y-5 p-6">
                    <div className="flex items-center gap-3">
                      <FolderOpen size={21} className="text-[#163B63]" />
                      <h3 className="font-bold text-slate-700">
                        {item.Name}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          اسم التخزين
                        </label>
                        <input
                          value={item.Name || ""}
                          onChange={(e) =>
                            updateStorageField(item.Id, "Name", e.target.value)
                          }
                          maxLength={50}
                          className="h-11 w-full rounded-xl border border-[#DCE4EF] px-4 text-sm outline-none focus:border-[#163B63]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          مسار التخزين
                        </label>
                        <input
                          value={item.BasePath || ""}
                          onChange={(e) =>
                            updateStorageField(
                              item.Id,
                              "BasePath",
                              e.target.value
                            )
                          }
                          maxLength={500}
                          dir="ltr"
                          className="h-11 w-full rounded-xl border border-[#DCE4EF] px-4 text-left text-sm outline-none focus:border-[#163B63]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <label className="flex items-center gap-3 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={Boolean(item.IsActive)}
                          onChange={(e) =>
                            updateStorageField(
                              item.Id,
                              "IsActive",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 accent-[#163B63]"
                        />
                        مسار التخزين نشط
                      </label>

                      <button
                        onClick={() => saveStorage(item)}
                        disabled={savingStorage === item.Id}
                        className="flex items-center gap-2 rounded-xl bg-[#163B63] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0D2B4B] disabled:opacity-50"
                      >
                        <Save size={16} />
                        {savingStorage === item.Id
                          ? "جاري الحفظ..."
                          : "حفظ مسار التخزين"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
