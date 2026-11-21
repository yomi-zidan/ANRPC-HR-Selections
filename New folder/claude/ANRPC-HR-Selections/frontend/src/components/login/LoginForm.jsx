"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Hash, KeyRound, Lock, UserRound, UsersRound, ShieldCheck } from "lucide-react";
import { Alert, Button, Field, Input, Segmented } from "@/components/ui";
import { readSession, saveSession } from "@/lib/auth";
import { employeeLogin } from "@/services/employeeService";
import { hrLogin } from "@/services/hrService";

const roles = [
  { value: "employee", label: "موظف", icon: UserRound },
  { value: "hr", label: "الموارد البشرية", icon: UsersRound },
];

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [role, setRole] = useState(params.get("role") === "hr" ? "hr" : "employee");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [existing, setExisting] = useState(null);

  const [empn, setEmpn] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const nextLoginField = useRef(null);

  function advanceOnEnter(event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    nextLoginField.current?.focus();
  }

  const expired = params.get("expired") === "1";

  // Offer to continue when a session is already active in this tab.
  useEffect(() => {
    const hr = readSession("hr");
    const employee = readSession("employee");
    if (hr) setExisting({ role: "hr", name: hr.user?.full_name || hr.user?.username });
    else if (employee) setExisting({ role: "employee", name: employee.user?.ename });
  }, []);

  function switchRole(next) {
    setRole(next);
    setError("");
    setShowSecret(false);
  }

  function continueSession() {
    router.replace(existing.role === "hr" ? "/hr/dashboard" : "/employee/submissions");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (role === "employee") {
      if (!empn.trim()) return setError("برجاء إدخال رقم القيد.");
      if (nationalId.length !== 14) return setError("الرقم القومي يجب أن يتكون من 14 رقمًا.");
    } else if (!username.trim() || !password) {
      return setError("برجاء إدخال اسم المستخدم وكلمة المرور.");
    }

    try {
      setLoading(true);

      if (role === "employee") {
        const result = await employeeLogin(empn.trim(), nationalId);
        saveSession("employee", result.token, result.employee);
        router.replace("/employee/submissions");
      } else {
        const result = await hrLogin(username.trim(), password);
        saveSession("hr", result.token, result.user);
        router.replace("/hr/dashboard");
      }
    } catch (err) {
      setError(err.message || "تعذر تسجيل الدخول.");
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <h2 className="text-3xl font-extrabold tracking-tight">مرحبًا بك 👋</h2>
      <p className="mt-2 text-sm leading-7 text-fg-muted">سجّل دخولك للمتابعة إلى قصص النجاح والتميز.</p>

      {expired && !error && (
        <Alert tone="warning" className="mt-6">انتهت جلسة الدخول، برجاء تسجيل الدخول مرة أخرى.</Alert>
      )}

      {existing && (
        <button
          type="button"
          onClick={continueSession}
          className="mt-6 flex w-full items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-soft p-4 text-start transition hover:bg-primary-soft-hover"
        >
          <span className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-primary" />
            <span>
              <span className="block text-sm font-bold text-primary">متابعة كـ {existing.name || "مستخدم"}</span>
              <span className="text-xs text-fg-muted">لديك جلسة نشطة بالفعل</span>
            </span>
          </span>
          <ArrowLeft size={18} className="text-primary" />
        </button>
      )}

      <Segmented options={roles} value={role} onChange={switchRole} className="mt-7 w-full" />

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        {role === "employee" ? (
          <>
            <Field label="رقم القيد" htmlFor="empn" required>
              <Input
                id="empn"
                icon={Hash}
                inputMode="numeric"
                autoComplete="username"
                placeholder="مثال: 12345"
                value={empn}
                onChange={(e) => setEmpn(e.target.value.replace(/\D/g, ""))}
                onKeyDown={advanceOnEnter}
              />
            </Field>

            <Field
              label="الرقم القومي"
              htmlFor="national_id"
              required
              hint={`${nationalId.length} / 14 رقمًا`}
            >
              <div className="relative">
                <Input
                  id="national_id"
                  icon={KeyRound}
                  type={showSecret ? "text" : "password"}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  placeholder="14 رقمًا"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 14))}
                  ref={nextLoginField}
                  className="pe-11 tracking-widest"
                />
                <SecretToggle shown={showSecret} onClick={() => setShowSecret((v) => !v)} />
              </div>
            </Field>
          </>
        ) : (
          <>
            <Field label="اسم المستخدم" htmlFor="username" required>
              <Input
                id="username"
                icon={UserRound}
                autoComplete="username"
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={advanceOnEnter}
              />
            </Field>

            <Field label="كلمة المرور" htmlFor="password" required>
              <div className="relative">
                <Input
                  id="password"
                  icon={Lock}
                  type={showSecret ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  ref={nextLoginField}
                  className="pe-11"
                />
                <SecretToggle shown={showSecret} onClick={() => setShowSecret((v) => !v)} />
              </div>
            </Field>
          </>
        )}

        <Alert tone="danger">{error}</Alert>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? "جاري التحقق..." : "تسجيل الدخول"}
          {!loading && <ArrowLeft size={17} />}
        </Button>
      </form>

      <p className="mt-8 text-center text-xs leading-6 text-fg-subtle">
        في حال واجهت مشكلة في الدخول، تواصل مع إدارة نظم المعلومات.
      </p>
    </div>
  );
}

function SecretToggle({ shown, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={shown ? "إخفاء" : "إظهار"}
      className="absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-fg-subtle transition hover:bg-surface-2 hover:text-fg"
    >
      {shown ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );
}
