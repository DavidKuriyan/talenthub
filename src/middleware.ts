import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from './lib/types'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                storageKey: 'talenthub-session',
            },
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()

    const url = request.nextUrl.clone()

    // Public auth pages - all login and register routes
    const publicAuthPages = [
        '/login',
        '/register',
        '/engineer/login',
        '/tenant/login',
        '/organization/login',
        '/organization/register',
        '/admin/login'
    ]
    const isAuthPage = publicAuthPages.some(page => url.pathname === page)

    if (!session && !isAuthPage) {
        // Context-aware login redirection
        if (url.pathname.startsWith('/admin')) {
            url.pathname = '/admin/login'
        } else if (url.pathname.startsWith('/organization')) {
            url.pathname = '/organization/login'
        } else if (url.pathname.startsWith('/engineer')) {
            url.pathname = '/engineer/login'
        } else {
            url.pathname = '/login'
        }
        return NextResponse.redirect(url)
    }

    if (session && isAuthPage) {
        // Context-aware dashboard redirection after login
        const role = session.user.app_metadata.role || session.user.user_metadata?.role
        const path = request.nextUrl.pathname

        // Portal-aware redirection
        if (path.startsWith('/admin')) {
            url.pathname = '/admin'
        } else if (path.startsWith('/engineer')) {
            url.pathname = '/engineer/profile'
        } else if (path.startsWith('/organization')) {
            url.pathname = '/organization/dashboard'
        } else {
            // Default based on role if generic /login used
            // super_admin and admin now default to organization dashboard 
            // to avoid unnecessary admin portal jumps from generic pages.
            if (role === 'provider') {
                url.pathname = '/engineer/profile'
            } else {
                url.pathname = '/organization/dashboard'
            }
        }
        return NextResponse.redirect(url)
    }

    // Inject tenant context and perform basic authorization
    if (session?.user) {
        const tenantId = session.user.app_metadata.tenant_id || 'talenthub'

        // Authorized role protection for /admin (except login page)
        if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
            const role = session.user.app_metadata.role || session.user.user_metadata?.role
            if (role !== 'admin' && role !== 'super_admin') {
                // Not an admin? Send back to organization dashboard
                url.pathname = '/organization/dashboard'
                return NextResponse.redirect(url)
            }
        }

        response.headers.set('x-tenant-id', tenantId)
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|vercel.svg|next.svg).*)'],
}
