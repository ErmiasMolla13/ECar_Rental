import pool from "@/app/libs/mysql";
import { NextResponse } from "next/server";

export async function GET(request) {
  let db;
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    db = await pool.getConnection();
    
    const searchQuery = `
      SELECT 
        c.id,
        c.car_code, 
        c.make, 
        c.model,
        c.rating,
        c.description, 
        c.price,
        c.image, 
        c.year, 
        c.car_type, 
        c.owner_id,
        c.is_booked,
        c.booking_info
      FROM car c
      WHERE 
        c.make LIKE ? OR 
        c.model LIKE ? OR 
        c.car_type LIKE ? OR
        c.description LIKE ?
    `;
    
    const searchTerm = `%${query}%`;
    const [rows] = await db.execute(searchQuery, [
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm
    ]);
    
    return NextResponse.json(rows);

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  } finally {
    if (db) db.release();
  }
}