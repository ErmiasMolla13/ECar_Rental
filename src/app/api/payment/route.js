import pool from "@/app/libs/mysql";
import { NextResponse } from "next/server";

export async function GET(request) {
  let db;
  try {
    const searchParams = request.nextUrl.searchParams;
    const payment_amount = searchParams.get("payment_amount");
    const payment_id = searchParams.get("payment_id");
    const payment_date = searchParams.get("payment_date");

    db = await pool.getConnection();

    let query = "SELECT * FROM payment";
    let params = [];

    if (payment_id && payment_amount && payment_date) {
      query = "SELECT * FROM payment WHERE payment_id = ? AND payment_amount = ? AND payment_date=?";
      params = [payment_id, payment_amount, payment_date];
    } else if (payment_id && payment_date) {
      query = "SELECT * FROM payment WHERE payment_id = ? AND payment_date=?";
      params = [payment_id, payment_date];
    } else if (payment_amount && payment_date) {
      query = "SELECT * FROM payment WHERE payment_amount = ? AND payment_date=?";
      params = [payment_amount, payment_date];
    }else if (payment_amount) {
      query = "SELECT * FROM payment WHERE payment_amount = ? ";
      params = [payment_amount];
    }
    else if (payment_date) {
      query = "SELECT * FROM payment WHERE payment_date = ? ";
      params = [payment_date];
    }
    else if (payment_id) {
      query = "SELECT * FROM payment WHERE payment_id = ? ";
      params = [payment_id];
    }else{
     query = "SELECT * FROM payment";
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

//post

export async function POST(request) {
  
  let db;

  try {
    
    const incoming_data = await request.json();
    db = await pool.getConnection();

    const query = `INSERT INTO payment(payment_amount, payment_date, custm_id, rent_id) VALUES (?,?,?,?)`;

    const params = [
      incoming_data.payment_amount,
      incoming_data.payment_date,
      incoming_data.custm_id,
      incoming_data.rent_id
    ];

    const [rows] = await db.execute(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json("DataBase Error")
  }finally{
    if (db) db.release();
  }
}