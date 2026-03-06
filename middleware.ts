import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  /* ---------------- Allow Public Pages ---------------- */

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/set-password")
  ) {
    return response;
  }

  /* ---------------- Create Supabase Client ---------------- */

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

  /* ---------------- Get Auth User ---------------- */

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
     ADMIN ROUTES
  ====================================================== */

  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    console.log("PROFILE:", profile);

    if (!profile || profile.role !== "admin") {
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
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    console.log("TENANT:", tenant);

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/bookings";
    return NextResponse.redirect(url);
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

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