import pool from "@/app/libs/mysql";
import { NextResponse } from "next/server";
import bcrypt from 'bcrypt';
import { requireRole } from "@/app/libs/authGuard";
import { checkRateLimit, getClientIp } from "@/app/libs/rateLimit";
import { sendVerificationEmail } from "@/app/libs/accountAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stripPassword(row) {
  const { password, ...rest } = row;
  return rest;
}

export async function GET(request) {
  let db;
  try {
    const guard = await requireRole('admin');
    if (guard.error) return guard.error;

    const searchParams = request.nextUrl.searchParams;
    const customer_name = searchParams.get("customer_name");
    const custm_id = searchParams.get("custm_id");
    const address = searchParams.get("address");

    db = await pool.getConnection();

    let query = "SELECT * FROM customer";
    let params = [];

    if (custm_id && customer_name && address) {
      query = "SELECT * FROM customer WHERE custm_id = ? AND customer_name = ? AND address=?";
      params = [custm_id, customer_name, address];
    } else if (custm_id && address) {
      query = "SELECT * FROM customer WHERE custm_id = ? AND address=?";
      params = [custm_id, address];
    } else if (customer_name && address) {
      query = "SELECT * FROM customer WHERE customer_name = ? AND address=?";
      params = [customer_name, address];
    } else if (customer_name) {
      query = "SELECT * FROM customer WHERE customer_name = ? ";
      params = [customer_name];
    } else if (address) {
      query = "SELECT * FROM customer WHERE address = ? ";
      params = [address];
    } else if (custm_id) {
      query = "SELECT * FROM customer WHERE custm_id = ? ";
      params = [custm_id];
    } else {
      query = "SELECT * FROM customer";
    }

    const [rows] = await db.execute(query, params);

    return NextResponse.json({
      rows: rows.map(stripPassword),
    });

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (db) db.release();
  }
}

export async function POST(request) {
  let db;
  try {
    const incoming_data = await request.json();

    if (!incoming_data.customer_name || !incoming_data.email || !incoming_data.password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(incoming_data.email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    if (incoming_data.password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const rate = checkRateLimit(`customer-register:${getClientIp(request)}`, 8, 60 * 60 * 1000);
    if (rate.limited) {
      return NextResponse.json(
        { message: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    db = await pool.getConnection();

    const [existingUser] = await db.execute(
      "SELECT * FROM customer WHERE LOWER(email) = LOWER(?)",
      [incoming_data.email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(incoming_data.password, 10);

    const [result] = await db.execute(
      "INSERT INTO customer (customer_name, contact, address, email, password) VALUES (?, ?, ?, ?, ?)",
      [
        incoming_data.customer_name,
        incoming_data.contact || null,
        incoming_data.address || null,
        incoming_data.email,
        hashedPassword
      ]
    );

    try {
      await sendVerificationEmail('customer', {
        id: result.insertId,
        email: incoming_data.email,
        name: incoming_data.customer_name,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        customerId: result.insertId,
        message: "Registration successful. Please check your email to verify your account before logging in."
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

export async function DELETE(request) {
  let db;
  try {
    const guard = await requireRole('admin');
    if (guard.error) return guard.error;

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    db = await pool.getConnection();

    const [existingCustomer] = await db.execute(
      'SELECT * FROM customer WHERE BINARY email = ?',
      [email.trim()]
    );

    if (existingCustomer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    const [result] = await db.execute(
      'DELETE FROM customer WHERE BINARY email = ?',
      [email.trim()]
    );

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
      affectedRows: result.affectedRows
    });

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Database operation failed",
      },
      { status: 500 }
    );
  } finally {
    if (db) db.release();
  }
}
