import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from './lib/types'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient<Database>({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    // For this bootcamp, we use path-based routing or host-based logic.
    // We'll inject the tenant_id from the session metadata into headers for server-side use.
    if (session?.user) {
        const tenantId = session.user.app_metadata.tenant_id
        if (tenantId) {
            res.headers.set('x-tenant-id', tenantId)
        }
    }

    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
