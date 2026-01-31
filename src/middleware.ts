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
        // Vital Check: Do NOT redirect to dashboard if tenant_id is missing for org users
        const tenantId = session.user.app_metadata.tenant_id || session.user.user_metadata?.tenant_id;

        // If user is basic/org role but has no tenant, let them stay on auth page (or maybe redirect to register?)
        // Ideally, if they are on /login and have no tenant, send them to /organization/register
        if (!tenantId && role !== 'admin' && role !== 'super_admin' && role !== 'provider') {
            // Allow them to stay on the auth page to login/register, or force to register
            // But if we return next(), it will show the login page even if logged in?
            // Actually, if we return next() while logged in, the page logic might show "You are logged in"
            // Let's redirect to register if they are effectively homeless
            if (url.pathname !== '/organization/register') {
                url.pathname = '/organization/register';
                return NextResponse.redirect(url);
            }
            return NextResponse.next();
        }

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
        const tenantId = session.user.app_metadata.tenant_id || session.user.user_metadata?.tenant_id;
        const role = session.user.app_metadata.role || session.user.user_metadata?.role;

        // 1. Tenant Check (Strict)
        if (!tenantId && role !== 'admin' && role !== 'super_admin' && role !== 'provider') {
            // Homeless Org User -> Force Register
            if (!url.pathname.startsWith('/organization/register')) {
                const registerUrl = request.nextUrl.clone();
                registerUrl.pathname = '/organization/register';
                return NextResponse.redirect(registerUrl);
            }
        } else if (!tenantId && role === 'provider') {
            // Engineers might not have tenant_id initially if they are global? 
            // Assuming usage of 'public' tenant or just allowing profile access.
            // For now, we allow providers without tenant to access profile to get set up.
        }

        // 2. Role-Based Route Protection (Strict)

        // Block Providers (Engineers) from Organization Routes
        if (url.pathname.startsWith('/organization') && role === 'provider') {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/engineer/profile';
            return NextResponse.redirect(redirectUrl);
        }

        // Block Org Users from Engineer Routes
        if (url.pathname.startsWith('/engineer') && role !== 'provider' && role !== 'admin' && role !== 'super_admin') {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/organization/dashboard';
            return NextResponse.redirect(redirectUrl);
        }

        // Admin Route Protection
        if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
            if (role !== 'admin' && role !== 'super_admin') {
                url.pathname = '/organization/dashboard';
                return NextResponse.redirect(url);
            }
        }

        if (tenantId) {
            response.headers.set('x-tenant-id', tenantId);
        }
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|vercel.svg|next.svg).*)'],
}
