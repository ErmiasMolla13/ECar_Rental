import { NextResponse } from 'next/server';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me';

function isTrustedOrigin(request) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  if (!origin && !referer) {
    return true;
  }

  try {
    const originHost = new URL(origin || referer).host;
    return originHost === host;
  } catch {
    return false;
  }
}


function base64UrlToBase64(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  return padded + '='.repeat(padLength);
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function verifyEdgeSessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const [payloadB64, signature] = token.split('.');

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
    const expectedSignature = bytesToBase64Url(new Uint8Array(sigBuffer));

    if (expectedSignature !== signature) return null;

    const json = atob(base64UrlToBase64(payloadB64));
    const payload = JSON.parse(json);

    if (!payload.exp || Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;


  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_session')?.value;
    const session = await verifyEdgeSessionToken(token);

    if (!session || session.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

 
  if (
    process.env.NODE_ENV === 'production' &&
    pathname.startsWith('/api/') &&
    MUTATING_METHODS.has(request.method) &&
    !isTrustedOrigin(request)
  ) {
    return NextResponse.json(
      { error: 'Cross-site request blocked' },
      { status: 403 }
    );
  }

  
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

export const config = {
  matcher: [
 
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
