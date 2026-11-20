
export default function LoginBackground({ children }) {
  return (
    <main
      dir="ltr"
      className="
        relative flex h-dvh w-full min-h-0
        items-center justify-center
        overflow-hidden
        bg-cover bg-center bg-no-repeat
        px-3
        sm:px-6
        lg:justify-end lg:px-12
        xl:px-20
      "
      style={{
        backgroundImage: "url('/images/login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[#071B33]/45" />

      <div className="absolute inset-0 bg-gradient-to-br from-[#0B2B4C]/30 via-transparent to-[#071B33]/70" />

      {/* Login Card Container */}
      <div
        dir="rtl"
        className="
          relative z-10 w-full
          max-w-[410px]
          lg:mr-0
        "
      >
        {children}
      </div>

      {/* Footer */}
      <footer
        className="
          absolute bottom-2 left-0 right-0 z-10
          px-3 text-center text-[10px] text-white/70
        "
      >
        Alexandria National Refining and Petrochemicals Company
      </footer>
    </main>
  );
}
