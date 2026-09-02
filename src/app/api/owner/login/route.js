import { NextResponse } from 'next/server';
import pool from "@/app/libs/mysql";
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { createSessionToken, cookieNameForRole, SESSION_MAX_AGE_SECONDS } from '@/app/libs/session';
import { checkRateLimit, getClientIp } from '@/app/libs/rateLimit';

export async function POST(request) {
  let db;
  try {
    const { email, password } = await request.json();

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const rate = checkRateLimit(`owner-login:${getClientIp(request)}:${cleanEmail}`, 5, 60 * 1000);
    if (rate.limited) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again shortly." },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    db = await pool.getConnection();

    const [userRows] = await db.execute(
      "SELECT * FROM owner WHERE LOWER(email) = ?",
      [cleanEmail]
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = userRows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.email_verified) {
      return NextResponse.json(
        {
          success: false,
          error: "Please verify your email before logging in. Check your inbox, or request a new link.",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 }
      );
    }

    const sessionToken = createSessionToken({
      id: user.owner_id,
      email: user.email,
      role: 'owner',
    });

    const cookieStore = await cookies();
    cookieStore.set(cookieNameForRole('owner'), sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    const { password: _pw, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("Owner login error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during login" },
      { status: 500 }
    );
  } finally {
    if (db) db.release();
  }
}
