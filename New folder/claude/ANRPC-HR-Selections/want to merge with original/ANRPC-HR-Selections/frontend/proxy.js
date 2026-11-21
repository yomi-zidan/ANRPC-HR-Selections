import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const isHR = pathname === "/hr" || pathname.startsWith("/hr/");
  const isEmployee = pathname === "/employee" || pathname.startsWith("/employee/");
  const hasSession = request.cookies.has(
    isHR ? "anrpc_hr_session" : "anrpc_employee_session"
  );

  if ((isHR || isEmployee) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && request.cookies.has("anrpc_hr_session")) {
    return NextResponse.redirect(new URL("/hr/dashboard", request.url));
  }
  if (pathname === "/login" && request.cookies.has("anrpc_employee_session")) {
    return NextResponse.redirect(new URL("/employee/submissions", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hr/:path*", "/employee/:path*", "/login"],
};
