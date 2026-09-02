import { NextResponse } from 'next/server';
import { resetPasswordWithToken } from '@/app/libs/accountAuth';
import { checkRateLimit, getClientIp } from '@/app/libs/rateLimit';

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    const rate = checkRateLimit(`reset-password:admin:${getClientIp(request)}`, 10, 15 * 60 * 1000);
    if (rate.limited) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const result = await resetPasswordWithToken('admin', token, password);
    return NextResponse.json(
      { success: result.success, message: result.message },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
