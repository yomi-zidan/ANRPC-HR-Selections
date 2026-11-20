
export default function LoginBackground({ children }) {
  return (
    <main
      className="relative flex min-h-dvh w-full items-center justify-center
      overflow-x-hidden bg-cover bg-center bg-no-repeat
      px-4 py-8 sm:px-6 sm:py-10"
      style={{
        backgroundImage: "url('/images/login-bg.png')",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#071B33]/65" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br
        from-[#0B2B4C]/40 via-transparent to-[#071B33]/75" />

      {/* Login Content */}
      <div className="relative z-10 w-full max-w-[460px]">
        {children}
      </div>

      {/* Footer */}
      <footer className="absolute bottom-3 left-0 right-0 z-10
        px-3 text-center text-[10px] text-white/70 sm:text-xs">
        Alexandria National Refining and Petrochemicals Company
      </footer>
    </main>
  );
}
