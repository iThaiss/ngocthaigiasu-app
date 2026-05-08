import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    const teacherAdminRoutes = ['/questions']
    const isTeacherAdminRoute = teacherAdminRoutes.some((r) => pathname.startsWith(r))

    if (isTeacherAdminRoute) {
      const role = token?.role as string | undefined
      if (role !== 'teacher' && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/solve/:path*',
    '/exam/:path*',
    '/profile/:path*',
    '/payment/:path*',
    '/affiliate/:path*',
    '/notifications/:path*',
    '/questions/:path*',
  ],
}
