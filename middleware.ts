import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {

  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  /* ======================================================
     Allow Public Pages
  ====================================================== */

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/set-password")
  ) {
    return response;
  }

  /* ======================================================
     Create Supabase Client
  ====================================================== */

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  /* ======================================================
     Get Authenticated User
  ====================================================== */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("MIDDLEWARE USER:", user?.id);

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  /* ======================================================
     Load User Role + Tenant Once
  ====================================================== */

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  console.log("PROFILE:", profile);
  console.log("TENANT:", tenant);

  /* ======================================================
     REPORT ROUTES (Invoice / Printable Pages)
     These must work inside iframe previews
  ====================================================== */

  if (pathname.startsWith("/reports")) {

    if (profile?.role === "admin") {
      return response;
    }

    if (tenant) {
      return response;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  /* ======================================================
     ADMIN ROUTES
  ====================================================== */

  if (pathname.startsWith("/admin")) {

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }

    return response;
  }

  /* ======================================================
     PORTAL ROUTES
  ====================================================== */

  if (pathname.startsWith("/portal")) {

    if (!tenant) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    return response;
  }

  /* ======================================================
     FALLBACK REDIRECT
  ====================================================== */

  if (profile?.role === "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/bookings";
    return NextResponse.redirect(url);
  }

  if (tenant) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal/bookings";
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};