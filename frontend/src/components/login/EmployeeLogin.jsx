
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserRound,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EmployeeLogin() {
  const router = useRouter();

  const [empn, setEmpn] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [showNationalId, setShowNationalId] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/employee/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            empn: Number(empn),
            national_id: nationalId,
          }),
        }
      );

      const data = await response.json();

      // Check login response
      if (!response.ok || !data.success || !data.token) {
        setError(
          data.message || "الرقم الوظيفي أو الرقم القومي غير صحيح"
        );
        return;
      }

      // Save authentication token
      sessionStorage.setItem("auth_token", data.token);

      // Save employee information
      sessionStorage.setItem(
        "employee",
        JSON.stringify(data.employee)
      );

      // Navigate to employee submissions
      router.push("/employee/submissions");

    } catch (error) {
      console.error("Employee Login Error:", error);

      setError(
        "تعذر الاتصال بالخادم، برجاء المحاولة مرة أخرى"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">

      {/* Employee Number */}
      <div className="space-y-1.5">
        <Label>الرقم الوظيفي</Label>

        <div className="relative">
          <UserRound className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />

          <Input
            type="text"
            inputMode="numeric"
            placeholder="أدخل الرقم الوظيفي"
            className="h-12 pr-10 text-right"
            value={empn}
            onChange={(e) =>
              setEmpn(e.target.value.replace(/\D/g, ""))
            }
            required
          />
        </div>
      </div>

      {/* National ID */}
      <div className="space-y-1.5">
        <Label>الرقم القومي</Label>

        <div className="relative">
          <CreditCard className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />

          <Input
            type={showNationalId ? "text" : "password"}
            inputMode="numeric"
            maxLength={14}
            placeholder="أدخل الرقم القومي"
            className="h-12 pr-10 pl-11 text-right"
            value={nationalId}
            onChange={(e) =>
              setNationalId(
                e.target.value.replace(/\D/g, "").slice(0, 14)
              )
            }
            required
          />

          {/* Show / Hide National ID */}
          <button
            type="button"
            onClick={() =>
              setShowNationalId((prev) => !prev)
            }
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#163B63] transition-colors"
            aria-label={
              showNationalId
                ? "إخفاء الرقم القومي"
                : "إظهار الرقم القومي"
            }
          >
            {showNationalId ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
        </div>

        {nationalId.length > 0 && nationalId.length !== 14 && (
          <p className="text-xs text-red-500">
            الرقم القومي يجب أن يتكون من 14 رقمًا
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Login Button */}
      <Button
        type="submit"
        disabled={
          loading ||
          nationalId.length !== 14 ||
          !empn
        }
        className="!h-12 !w-full !bg-[#163B63] !text-base !text-white hover:!bg-[#0D2B4B] disabled:!bg-[#163B63] disabled:!text-white disabled:!opacity-100"
      >
        {loading ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            جاري تسجيل الدخول...
          </>
        ) : (
          "تسجيل الدخول"
        )}
      </Button>

    </form>
  );
}
