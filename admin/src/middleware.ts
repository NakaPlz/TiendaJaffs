import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Múltiples rutas que requieren estar logueado
const protectedRoutes = ['/dashboard', '/menu', '/orders', '/reports']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const isAdminPath = protectedRoutes.some(route => pathname.startsWith(route)) || pathname === '/'

    if (isAdminPath) {
        const tokenCookie = request.cookies.get('admin_token')
        const hasToken = !!tokenCookie
        const role = tokenCookie?.value // "admin" o "employee"

        if (!hasToken) {
            const loginUrl = new URL('/login', request.url)
            return NextResponse.redirect(loginUrl)
        }

        // Restricciones para el Empleado
        if (role === 'employee') {
            if (pathname === '/' || pathname === '/dashboard' || !pathname.startsWith('/dashboard/orders')) {
                return NextResponse.redirect(new URL('/dashboard/orders', request.url))
            }
        } else {
            // Administrador
            if (pathname === '/') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }
    }

    // Si ya estamos en login y tenemos token, mandarlo donde corresponda
    if (pathname === '/login') {
        const tokenCookie = request.cookies.get('admin_token')
        if (tokenCookie) {
            if (tokenCookie.value === 'employee') {
                return NextResponse.redirect(new URL('/dashboard/orders', request.url))
            }
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
