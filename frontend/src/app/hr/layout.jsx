
import HRSidebar from "@/components/layout/HRSidebar";
import HRTopbar from "@/components/layout/HRTopbar";

export default function HRLayout({ children }) {
  return (
    <div dir="rtl" className="min-h-screen bg-[#F2F4F8]">
      <HRSidebar />

      <div className="min-h-screen mr-0 md:mr-[260px]">
        <HRTopbar />
        <main className="min-h-[calc(100vh-76px)] p-4 md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
