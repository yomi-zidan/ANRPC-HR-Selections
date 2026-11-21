import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata = {
  title: "ANRPC | نظام الاختيارات الوظيفية",
  description: "بوابة الاختيارات الوظيفية الداخلية — شركة الإسكندرية الوطنية للتكرير والبتروكيماويات",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// Applies the saved/system theme before first paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
