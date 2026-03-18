import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {

  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  /* ======================================================
     SUPABASE AUTH
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* ======================================================
     NOT LOGGED IN
     (Propagate cookies to redirect so session updates reach mobile clients)
  ====================================================== */

  if (!user) {

    const url = request.nextUrl.clone();
    url.pathname = "/login";

    const redirectRes = NextResponse.redirect(url, 302);
    response.cookies.getAll().forEach((c) => {
      redirectRes.cookies.set(c.name, c.value);
    });
    return redirectRes;

  }

  /* ======================================================
     LOAD PROFILE + TENANT
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

  /* ======================================================
     ADMIN ROUTES
  ====================================================== */

  if (pathname.startsWith("/admin")) {

    if (profile?.role !== "admin") {

      const url = request.nextUrl.clone();
      url.pathname = "/portal";

      const redirectRes = NextResponse.redirect(url, 302);
      response.cookies.getAll().forEach((c) => {
        redirectRes.cookies.set(c.name, c.value);
      });
      return redirectRes;

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

      const redirectRes = NextResponse.redirect(url, 302);
      response.cookies.getAll().forEach((c) => {
        redirectRes.cookies.set(c.name, c.value);
      });
      return redirectRes;

    }

    return response;

  }

  return response;

}

/* ======================================================
   ONLY RUN MIDDLEWARE ON PROTECTED ROUTES
====================================================== */

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/portal/:path*"
  ],
};