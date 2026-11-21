import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata = {
  title: "ANRPC | قصص النجاح والتميز",
  description: "منصة موحّدة لتقديم المشاركات ومتابعتها وتقييمها — شركة الإسكندرية الوطنية للتكرير والبتروكيماويات",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// Light mode is the default; an explicitly saved dark choice is still respected.
const themeScript = `try{if(localStorage.getItem("theme")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
