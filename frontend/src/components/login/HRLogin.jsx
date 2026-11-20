
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function HRLogin() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/hr/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.token) {
        setError(data.message || "تعذر تسجيل الدخول.");
        return;
      }

      sessionStorage.setItem("hr_token", data.token);
      sessionStorage.setItem("hr_user", JSON.stringify(data.user));

      router.push("/hr/dashboard");
    } catch (err) {
      setError("تعذر الاتصال بالخادم. تأكدي من تشغيل Laravel.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>اسم المستخدم</Label>

        <div className="relative">
          <UserRound className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />

          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-12 pr-10 text-left"
            dir="ltr"
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>كلمة المرور</Label>

        <div className="relative">
          <LockKeyhole className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 pr-10 text-left"
            dir="ltr"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600" dir="rtl">
          {error}
        </p>
      )}

      <Button
        className="h-12 w-full bg-[#163B63] text-base hover:bg-[#0D2B4B]"
        type="submit"
        disabled={loading}
      >
        {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
      </Button>
    </form>
  );
}
