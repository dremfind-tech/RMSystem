import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
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

    const { data: { user } } = await supabase.auth.getUser()

    // Exclude static assets/images/favicon from middleware (handled by config matcher mostly, but double check)

    const path = request.nextUrl.pathname;

    // Public routes
    if (path.startsWith('/login') || path.startsWith('/unauthorized')) {
        if (user && path.startsWith('/login')) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        return response
    }

    // Protected routes
    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Role check
    // Adapting to case-insensitive check and location (app_metadata or user_metadata)
    const role = (user.app_metadata?.role || user.user_metadata?.role || '').toLowerCase();

    // NOTE: If testing with a user without role, this might block. 
    // Ideally, the admin creation process sets this.
    // For now, I will enforce it as per requirements.
    if (role !== 'admin') {
        // return NextResponse.redirect(new URL('/unauthorized', request.url))
        // Commenting out strict enforcement for initial setup to avoid lockout 
        // if the first user isn't properly seeded with metadata. 
        // User can uncomment this or I can enable it if I'm sure about the seed.
        // Given "PRODUCTION-READY", I should probably enable it, but I'll leave it as a TODO comment check 
        // or check if role is missing entirely (maybe allow if missing during dev?) 
        // No, requirements are strict. "Redirect non-admin users to /unauthorized".
        // I'll Enable it but log if role is missing.

        if (role !== 'admin') {
            return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
