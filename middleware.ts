import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  const { pathname } = req.nextUrl;

//  if (!token && pathname.startsWith("/dashboard")) {
//  const loginUrl = new URL("/login", req.url);
//   return NextResponse.redirect(loginUrl);
//  }

//   if (token && (pathname === "/login" || pathname === "/register")) {
//     const dashboardUrl = new URL("/dashboard", req.url);
//     return NextResponse.redirect(dashboardUrl);
//   }

  return NextResponse.next();
}


export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
