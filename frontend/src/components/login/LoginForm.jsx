
"use client";

import { useState } from "react";
import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import UserTypeSelector from "./UserTypeSelector";
import EmployeeLogin from "./EmployeeLogin";
import HRLogin from "./HRLogin";

export default function LoginForm() {
  const [userType, setUserType] = useState("employee");

  return (
    <Card className="w-full h-lvh  overflow-hidden rounded-3xl
      border border-white/50 bg-white shadow-2xl
      shadow-black/20">

      <CardContent className="p-4 sm:p-5 md:p-6">

        {/* Company Identity */}
        <div className="mb-6 flex flex-col items-center text-center">

          <h1 className="text-2xl font-bold tracking-wide
            text-[#163B63] sm:text-3xl">
            التميز المؤسسي
          </h1>
          <p className="mt-6 text-xs font-medium text-slate-600">
            قصص النجاح و الإنجازات المتميزة
          </p>
        </div>

        <Separator className="mb-5" />

        {/* Welcome */}
        <div className="mb-5 text-center">
          <h2 className="text-xl font-bold text-[#163B63]">
            مرحباً بك
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            من فضلك اختر نوع تسجيل الدخول
          </p>
        </div>

        {/* User Type */}
        <UserTypeSelector
          value={userType}
          onChange={setUserType}
        />

        {/* Section Divider */}
        <div className="my-5 flex items-center gap-3">
          <Separator className="flex-1" />

          <span className="whitespace-nowrap text-xs font-medium text-slate-400">
            {userType === "employee"
              ? "دخول الموظفين"
              : "دخول الموارد البشرية"}
          </span>

          <Separator className="flex-1" />
        </div>

        {/* Login Form */}
        <div className="min-h-[190px]">
          {userType === "employee" ? (
            <EmployeeLogin />
          ) : (
            <HRLogin />
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} ANRPC. All Rights Reserved.
          </p>
        </div>

      </CardContent>
    </Card>
  );
}
