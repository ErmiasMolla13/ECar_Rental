import { NextResponse } from 'next/server';
import pool from "@/app/libs/mysql";
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { createSessionToken, cookieNameForRole, SESSION_MAX_AGE_SECONDS } from '@/app/libs/session';
import { checkRateLimit, getClientIp } from '@/app/libs/rateLimit';

export async function POST(request) {
  let db;
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }
    
    const cleanEmail = email.trim().toLowerCase();

    const rate = checkRateLimit(`customer-login:${getClientIp(request)}:${cleanEmail}`, 5, 60 * 1000);
    if (rate.limited) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again shortly." },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    db = await pool.getConnection();

    // Check if user exists
    const [userRows] = await db.execute(
      "SELECT * FROM customer WHERE email = ?",
      [cleanEmail]
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" }, 
        { status: 401 }
      );
    }

    const user = userRows[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const legacyToken = uuidv4();
    await db.execute(
      "UPDATE customer SET session_token = ? WHERE email = ?",
      [legacyToken, cleanEmail]
    );

    const sessionToken = createSessionToken({
      id: user.custm_id,
      email: user.email,
      role: 'customer',
    });

    const cookieStore = await cookies();
    cookieStore.set(cookieNameForRole('customer'), sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({ 
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "An error occurred during login" 
      },
      { status: 500 }
    );
  } finally {
    if (db) db.release();
  }
}