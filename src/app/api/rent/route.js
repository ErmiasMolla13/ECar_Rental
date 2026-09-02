import pool from "@/app/libs/mysql";
import { NextResponse } from "next/server";

export async function GET(request) {
  let db;
  try {
    const searchParams = request.nextUrl.searchParams;
    const rent_date = searchParams.get("rent_date");
    const rent_id = searchParams.get("rent_id");
    const pickup_date = searchParams.get("pickup_date");

    db = await pool.getConnection();

    let query = `
      SELECT r.*, c.make, c.model 
      FROM rent r
      LEFT JOIN car c ON r.car_id = c.id
      ORDER BY r.rent_date DESC
    `;
    let params = [];

    if (rent_id && rent_date && pickup_date) {
      query = `
        SELECT r.*, c.make, c.model 
        FROM rent r
        LEFT JOIN car c ON r.car_id = c.id
        WHERE r.rent_id = ? AND r.rent_date = ? AND r.pickup_date=?
        ORDER BY r.rent_date DESC
      `;
      params = [rent_id, rent_date, pickup_date];
    } else if (rent_id) {
      query = `
        SELECT r.*, c.make, c.model 
        FROM rent r
        LEFT JOIN car c ON r.car_id = c.id
        WHERE r.rent_id = ?
        ORDER BY r.rent_date DESC
      `;
      params = [rent_id];
    }

    const [rows] = await db.execute(query, params);
    
    return NextResponse.json({ 
      rows: rows, 
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
    db = await pool.getConnection();

    const sql = `
      INSERT INTO rent(
        rent_date, 
        pickup_date, 
        return_date, 
        customer_name, 
        email,
        car_id
      ) VALUES (?, ?, ?, ?, ?, ?)`;
    
    const [rows] = await db.execute(sql, [
      incoming_data.rent_date || new Date().toISOString().split('T')[0],
      incoming_data.pickup_date,
      incoming_data.return_date,
      incoming_data.customer_name,
      incoming_data.email,
      incoming_data.car_id
    ]);
    
    return NextResponse.json({ 
      success: true,
      rent_id: rows.insertId 
    });

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create rent record" },
      { status: 500 }
    );
  } finally {
    if (db) db.release();
  }
}