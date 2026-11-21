"use client";

import HRSidebar from "@/components/layout/HRSidebar";
import HRTopbar from "@/components/layout/HRTopbar";
import { PageLoader } from "@/components/ui";
import { useSession } from "@/lib/auth";

export default function HRLayout({ children }) {
  const { ready, user } = useSession("hr");

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <PageLoader text="جاري التحقق من الجلسة..." />
      </div>
    );
  }

  return (
    <div className="min-h-dvh overflow-x-clip">
      <HRSidebar />
      <div className="min-h-dvh pb-24 md:ms-[264px] md:pb-0">
        <HRTopbar user={user} />
        <main className="mx-auto w-full max-w-[1480px] p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
