import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Refresh the session so it doesn't expire mid-visit
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — keeps auth tokens alive across requests
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public customer browsing routes — NO login required (Zomato/Swiggy style)
  const PUBLIC_CUSTOMER_PREFIXES = [
    "/dashboard/customer/restaurant/",
    "/dashboard/customer/dish/",
    "/dashboard/customer/all-restaurants",
    "/dashboard/customer/all-dishes",
    "/dashboard/customer/category/",
    "/dashboard/customer/search",
    "/dashboard/customer/cart", // Cart is public (guests have a localStorage cart)
  ];

  const isPublicCustomerRoute = PUBLIC_CUSTOMER_PREFIXES.some(prefix =>
    pathname.startsWith(prefix)
  );

  // Routes that require authentication
  const isAdminRoute  = pathname.startsWith("/dashboard/admin");
  const isDriverRoute = pathname.startsWith("/dashboard/driver");
  const isOwnerRoute  = pathname.startsWith("/dashboard/owner");
  const isPersonalCustomerRoute =
    pathname.startsWith("/dashboard/customer/orders") ||
    pathname.startsWith("/dashboard/customer/profile") ||
    pathname.startsWith("/dashboard/customer/settings") ||
    pathname === "/dashboard/customer" ||
    pathname === "/dashboard/customer/" ||
    pathname === "/dashboard";

  const isProtected = (isAdminRoute || isDriverRoute || isOwnerRoute || isPersonalCustomerRoute) && !isPublicCustomerRoute;
  const isAuthPage  = pathname === "/login" || pathname === "/register";

  // Unauthenticated → redirect to login for protected routes only
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve the intended destination so we can redirect back after login
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Already logged in → redirect away from auth pages to dashboard
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
