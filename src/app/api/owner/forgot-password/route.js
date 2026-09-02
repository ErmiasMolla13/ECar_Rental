import { NextResponse } from 'next/server';
import { requestPasswordReset } from '@/app/libs/accountAuth';
import { checkRateLimit, getClientIp } from '@/app/libs/rateLimit';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const rate = checkRateLimit(`forgot-password:owner:${getClientIp(request)}:${cleanEmail}`, 3, 15 * 60 * 1000);
    if (rate.limited) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    await requestPasswordReset('owner', cleanEmail);

    return NextResponse.json({
      success: true,
      message: 'If that email is registered, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
