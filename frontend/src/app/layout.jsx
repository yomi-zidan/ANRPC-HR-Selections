
import "./globals.css";

export const metadata = {
  title: "ANRPC | HR Selections",
  description: "ANRPC Internal HR Selections Portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
