import { Suspense } from "react";
import LoginBackground from "@/components/login/LoginBackground";
import LoginForm from "@/components/login/LoginForm";

export const metadata = { title: "تسجيل الدخول | ANRPC" };

export default function LoginPage() {
  return (
    <LoginBackground>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </LoginBackground>
  );
}
