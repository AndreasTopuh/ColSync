import { NextResponse, NextRequest } from 'next/server';

/**
 * Generate a short unique request ID for log correlation.
 * Uses crypto.randomUUID() which is available in all modern runtimes.
 */
function generateRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for environments without crypto.randomUUID
    return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const requestId = generateRequestId();

  // NICE-3: Request ID / Correlation ID for logging
  response.headers.set('x-request-id', requestId);
  request.headers.set('x-request-id', requestId);

  // CRIT-2: Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  );
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );

  // NICE-2: Content-Security-Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://api.emailjs.com https://api.openai.com https://generativelanguage.googleapis.com https://remotive.com https://remoteok.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  );

  // NICE-4: Admin route server-side protection
  // Client-side auth handles redirects for /admin, 
  // since `localStorage` is used by the frontend Supabase client.
  // The actual auth validation happens in the admin page component.

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|icon).*)'],
};
