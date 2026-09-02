import pool from "@/app/libs/mysql";
import { NextResponse } from "next/server";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { requireRole } from "@/app/libs/authGuard";
import { checkRateLimit, getClientIp } from "@/app/libs/rateLimit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendVerificationEmail(email, name, token) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: "Admin Portal",
        email: process.env.SENDER_EMAIL,
      },
      to: [{ email, name }],
      subject: "Verify your Admin Account",
      htmlContent: `
        <h3>Welcome, ${name}!</h3>
        <p>Please click the button below to verify your admin email address:</p>
        <a href="${verifyUrl}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
        <p>Or copy this link to your browser: <br/> ${verifyUrl}</p>
        <p>This verification link expires in 24 hours.</p>
      `,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to send Brevo verification email');
  }

  return response.json();
}

function stripPassword(row) {
  const { password, verification_token, token_expiry, ...rest } = row;
  return rest;
}

// GET Handler - Restricted to authenticated admins
export async function GET(request) {
  let db;
  try {
    const guard = await requireRole('admin');
    if (guard.error) return guard.error;

    const searchParams = request.nextUrl.searchParams;
    const admin_name = searchParams.get("admin_name");
    const admin_id = searchParams.get("admin_id");
    const address = searchParams.get("address");

    db = await pool.getConnection();

    let query = "SELECT * FROM admin";
    let params = [];

    if (admin_id && admin_name && address) {
      query = "SELECT * FROM admin WHERE admin_id = ? AND admin_name = ? AND address = ?";
      params = [admin_id, admin_name, address];
    } else if (admin_id && address) {
      query = "SELECT * FROM admin WHERE admin_id = ? AND address = ?";
      params = [admin_id, address];
    } else if (admin_name && address) {
      query = "SELECT * FROM admin WHERE admin_name = ? AND address = ?";
      params = [admin_name, address];
    } else if (admin_name) {
      query = "SELECT * FROM admin WHERE admin_name = ?";
      params = [admin_name];
    } else if (address) {
      query = "SELECT * FROM admin WHERE address = ?";
      params = [address];
    } else if (admin_id) {
      query = "SELECT * FROM admin WHERE admin_id = ?";
      params = [admin_id];
    }

    const [rows] = await db.execute(query, params);

    return NextResponse.json({
      rows: rows.map(stripPassword),
    });

  } catch (error) {
    console.error("Database GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (db) db.release();
  }
}

// POST Handler - Admin Registration with Brevo Email Verification
export async function POST(request) {
  let db;
  try {
    let incoming_data;
    try {
      incoming_data = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid or missing JSON payload" },
        { status: 400 }
      );
    }

    const { admin_name, contact, address, email, password } = incoming_data || {};

   
    if (!admin_name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields: 'admin_name', 'email', and 'password' are required." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const rate = checkRateLimit(`admin-register:${getClientIp(request)}`, 5, 60 * 60 * 1000);
    if (rate.limited) {
      return NextResponse.json(
        { message: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    db = await pool.getConnection();

    const [existingUser] = await db.execute(
      "SELECT admin_id FROM admin WHERE LOWER(email) = LOWER(?)",
      [email.trim()]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    // Generate Verification Token & Expiry (24-hour expiry)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO admin 
       (admin_name, address, contact, email, password, is_verified, verification_token, token_expiry) 
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        admin_name.trim(),
        address || null,
        contact || null,
        email.trim().toLowerCase(),
        hashedPassword,
        verificationToken,
        tokenExpiry
      ]
    );

    //  Send Verification Email via Brevo
    try {
      if (!process.env.BREVO_API_KEY) {
        throw new Error("BREVO_API_KEY is missing from environment variables.");
      }
      if (!process.env.SENDER_EMAIL) {
        throw new Error("SENDER_EMAIL is missing from environment variables.");
      }

      await sendVerificationEmail(email.trim().toLowerCase(), admin_name.trim(), verificationToken);
    } catch (emailError) {
      console.error("Detailed Brevo Error:", emailError);
      
      // Rollback database insertion if email fails to send
      await db.execute("DELETE FROM admin WHERE admin_id = ?", [result.insertId]);

      return NextResponse.json(
        { 
          message: emailError.message || "Failed to send verification email.",
          error_details: emailError.toString()
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        adminId: result.insertId,
        message: "Admin registered successfully. Please check your email to verify your account."
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (db) db.release();
  }
}

// DELETE Handler - Admin Deletion
export async function DELETE(request) {
  let db;

  try {
    const guard = await requireRole('admin');
    if (guard.error) return guard.error;

    let incoming_data;
    try {
      incoming_data = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { email } = incoming_data || {};

    if (!email) {
      return NextResponse.json(
        { error: "Email is required for deletion" },
        { status: 400 }
      );
    }

    db = await pool.getConnection();

    const [existingUser] = await db.execute(
      `SELECT admin_id FROM admin WHERE LOWER(email) = LOWER(?)`,
      [email.trim()]
    );

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "User with this email does not exist" },
        { status: 404 }
      );
    }

    const [rows] = await db.execute(
      `DELETE FROM admin WHERE LOWER(email) = LOWER(?)`,
      [email.trim()]
    );

    return NextResponse.json({
      message: "User deleted successfully",
      affectedRows: rows.affectedRows
    });

  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json({
      error: "Error processing delete request",
      details: error.message
    }, { status: 500 });
  } finally {
    if (db) db.release();
  }
}