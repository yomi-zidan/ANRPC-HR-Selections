import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="max-w-md text-center animate-fade-up">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Compass size={30} />
        </span>
        <p className="text-6xl font-extrabold tracking-tight text-primary">404</p>
        <h1 className="mt-3 text-xl font-bold">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm leading-7 text-fg-muted">
          الرابط الذي تحاول الوصول إليه غير صحيح أو تم نقله.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-fg hover:bg-primary-hover"
        >
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
