import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const hrSession = request.cookies.has("anrpc_hr_session");
  const employeeSession = request.cookies.has("anrpc_employee_session");

  if (pathname === "/") {
    if (hrSession) {
      return NextResponse.redirect(new URL("/hr/dashboard", request.url));
    }
    if (employeeSession) {
      return NextResponse.redirect(new URL("/employee/submissions", request.url));
    }
  }

  const isHR = pathname === "/hr" || pathname.startsWith("/hr/");
  const isEmployee = pathname === "/employee" || pathname.startsWith("/employee/");
  const hasSession = request.cookies.has(
    isHR ? "anrpc_hr_session" : "anrpc_employee_session"
  );

  if ((isHR || isEmployee) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
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
  matcher: ["/", "/hr/:path*", "/employee/:path*", "/login"],
};
