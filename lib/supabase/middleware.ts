import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
    // Allow access to auth pages and home page when env vars are missing
    if (request.nextUrl.pathname.startsWith("/auth") || request.nextUrl.pathname === "/") {
      return supabaseResponse
    }
    // Redirect to login for protected routes
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Simple role mapping: the admin user is the hard-coded email
  // All other authenticated users are treated as "manager"
  const adminEmail = process.env.ADMIN_EMAIL || "hello@tripbooking.ai"
  const isAdmin = !!user && user.email === adminEmail

  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If user is authenticated but not admin (i.e. a manager), restrict
  // their access to sales-related pages only. Managers should still be
  // able to hit auth pages (login/logout) so we allow /auth/*.
  if (user && !isAdmin) {
    const pathname = request.nextUrl.pathname

    const isAuthPath = pathname.startsWith("/auth") || pathname.startsWith("/login")
    const isSalesPath = pathname === "/sales" || pathname.startsWith("/sales/")

    if (!isAuthPath && !isSalesPath) {
      // Redirect managers to the sales listing page
      const url = request.nextUrl.clone()
      url.pathname = "/sales"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
