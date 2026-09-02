import { NextResponse } from 'next/server';
import { verifyEmailToken, sendVerificationEmail } from '@/app/libs/accountAuth';
import pool from '@/app/libs/mysql';
import { checkRateLimit, getClientIp } from '@/app/libs/rateLimit';

function htmlResponse(title, message, ok) {
  return new NextResponse(
    `<!DOCTYPE html>
    <html><head><meta charset="utf-8"><title>${title}</title></head>
    <body style="font-family: system-ui, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; text-align:center;">
      <div>
        <h1 style="color:${ok ? '#16a34a' : '#dc2626'};">${title}</h1>
        <p>${message}</p>
        <a href="/" style="color:#111;">Back to home</a>
      </div>
    </body></html>`,
    { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html' } }
  );
}

export async function GET(request) {
  const token = request.nextUrl.searchParams.get('token');
  const result = await verifyEmailToken('owner', token);
  return htmlResponse(
    result.success ? 'Email verified' : 'Verification failed',
    result.message,
    result.success
  );
}

export async function POST(request) {
  let db;
  try {
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const rate = checkRateLimit(`resend-verify:${getClientIp(request)}:${email}`, 3, 5 * 60 * 1000);
    if (rate.limited) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    db = await pool.getConnection();
    const [rows] = await db.execute(
      'SELECT owner_id, owner_name, email, email_verified FROM owner WHERE LOWER(email) = LOWER(?)',
      [email.trim()]
    );

    if (rows.length > 0 && !rows[0].email_verified) {
      await sendVerificationEmail('owner', {
        id: rows[0].owner_id,
        email: rows[0].email,
        name: rows[0].owner_name,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If that email is registered and unverified, a new verification link has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  } finally {
    if (db) db.release();
  }
}
