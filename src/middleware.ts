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
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()

    const url = request.nextUrl.clone()
    const isAuthPage = url.pathname === '/login' || url.pathname === '/register'

    if (!session && !isAuthPage) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (session && isAuthPage) {
        url.pathname = '/products'
        return NextResponse.redirect(url)
    }

    // Inject tenant context and perform basic authorization
    if (session?.user) {
        const tenantId = session.user.app_metadata.tenant_id || 'talenthub'

        // Basic path-based protection for /admin
        if (url.pathname.startsWith('/admin')) {
            const role = session.user.app_metadata.role
            if (role !== 'admin') {
                url.pathname = '/products'
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
