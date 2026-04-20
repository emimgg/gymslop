export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/routines/:path*', '/meals/:path*', '/weight/:path*', '/feels/:path*', '/progress/:path*', '/trophies/:path*'],
};
