import Image from "next/image";
import { ShieldCheck, Trophy, Sparkles } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const highlights = [
  { icon: Sparkles, title: "شارك قصة نجاحك", text: "وثّق إنجازك الفردي أو الجماعي بسهولة مع مرفقاتك." },
  { icon: Trophy, title: "تقييم عادل وشفاف", text: "تقييم من لجنة الموارد البشرية وفق معايير معتمدة." },
  { icon: ShieldCheck, title: "بياناتك محمية", text: "دخول آمن بالرقم الوظيفي والرقم القومي." },
];

export default function LoginBackground({ children }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-sidebar text-white lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_75%)]" />
        <div className="pointer-events-none absolute -bottom-40 -start-32 h-[520px] w-[520px] rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -top-40 end-0 h-[420px] w-[420px] rounded-full bg-primary/40 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
            <Image src="/images/anrpc-logo.png" alt="ANRPC" width={44} height={44} priority className="h-full w-full object-contain" />
          </span>
          <div>
            <p className="text-lg font-extrabold">ANRPC</p>
            <p className="text-xs text-white/60">الإسكندرية الوطنية للتكرير والبتروكيماويات</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <h1 className="text-4xl font-extrabold leading-[1.35] text-balance">
            قصص النجاح والتميز
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-8 text-white/70">
            منصة موحّدة لتقديم المشاركات ومتابعتها وتقييمها.
          </p>

          <ul className="mt-10 space-y-5">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-accent">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/60">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} شركة ANRPC — جميع الحقوق محفوظة</p>
      </aside>

      {/* Form panel */}
      <section className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 lg:invisible">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white p-1.5 shadow-sm">
              <Image src="/images/anrpc-logo.png" alt="ANRPC" width={34} height={34} className="h-full w-full object-contain" />
            </span>
            <span className="text-sm font-extrabold">ANRPC</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>

        <p className="text-center text-xs text-fg-subtle lg:hidden">© {new Date().getFullYear()} شركة ANRPC</p>
      </section>
    </main>
  );
}
