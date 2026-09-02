import pool from "@/app/libs/mysql";
import { NextResponse } from "next/server";
import { requireRole } from "@/app/libs/authGuard";

// Creating a car listing requires an authenticated owner or admin.
export async function POST(request) {
  let db;
  try {
    const guard = await requireRole(['owner', 'admin']);
    if (guard.error) return guard.error;

    const incoming_data = await request.json();

    
    const owner_id = guard.role === 'owner' ? guard.session.id : incoming_data.owner_id;

    if (!incoming_data.car_code || !incoming_data.make || !incoming_data.model ||
        !incoming_data.price || !incoming_data.image || !incoming_data.year ||
        !incoming_data.car_type || !owner_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    db = await pool.getConnection();

    const checkQuery = `SELECT * FROM car WHERE car_code = ?`;
    const [existingCar] = await db.execute(checkQuery, [incoming_data.car_code]);

    if (existingCar.length > 0) {
      return NextResponse.json(
        { error: "Car with this code already exists" },
        { status: 400 }
      );
    }

    const sql = `INSERT INTO car 
                 (car_code, make, model, rating, description, price, image, year, car_type, owner_id, is_booked, booking_info) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, '{}')`;
    const [rows] = await db.execute(sql, [
      incoming_data.car_code,
      incoming_data.make,
      incoming_data.model,
      incoming_data.rating || 4.5,
      incoming_data.description || '',
      incoming_data.price,
      incoming_data.image,
      incoming_data.year,
      incoming_data.car_type,
      owner_id
    ]);

    return NextResponse.json({ success: true, data: rows });

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Database Error" },
      { status: 500 }
    );
  } finally {
    if (db) db.release();
  }
}

// Browsing cars stays public - that's the whole point of the site.
export async function GET(request) {
  let db;
  try {
    const { searchParams } = new URL(request.url);
    const isBooked = searchParams.get('is_booked');

    db = await pool.getConnection();

    let sql = `
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
    `;

    const params = [];
    if (isBooked !== null) {
      sql += ` WHERE c.is_booked = ?`;
      params.push(isBooked === 'true' ? 1 : 0);
    }

    const [rows] = await db.execute(sql, params);
    return NextResponse.json(rows);

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

// Updating a car requires an authenticated owner or admin. Owners are
// restricted to their own cars.
export async function PUT(request) {
  let db;
  try {
    const guard = await requireRole(['owner', 'admin']);
    if (guard.error) return guard.error;

    const incoming_data = await request.json();

    if (!incoming_data.car_code) {
      return NextResponse.json(
        { error: "Car code is required" },
        { status: 400 }
      );
    }

    db = await pool.getConnection();

    const [existingCar] = await db.execute(
      'SELECT * FROM car WHERE car_code = ?',
      [incoming_data.car_code]
    );

    if (existingCar.length === 0) {
      return NextResponse.json(
        { success: false, error: "Car not found" },
        { status: 404 }
      );
    }

    if (guard.role === 'owner' && existingCar[0].owner_id !== guard.session.id) {
      return NextResponse.json(
        { success: false, error: "You can only update your own cars" },
        { status: 403 }
      );
    }

    const updateFields = [];
    const updateValues = [];

    const fieldsToUpdate = [
      'make', 'model', 'rating', 'description', 'price',
      'image', 'year', 'car_type', 'is_booked', 'booking_info'
    ];
   
    if (guard.role === 'admin' && incoming_data.owner_id !== undefined) {
      fieldsToUpdate.push('owner_id');
    }

    fieldsToUpdate.forEach(field => {
      if (incoming_data[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(incoming_data[field]);
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    updateValues.push(incoming_data.car_code);

    const sql = `UPDATE car SET ${updateFields.join(', ')} WHERE car_code = ?`;
    const [result] = await db.execute(sql, updateValues);

    return NextResponse.json({
      success: true,
      message: "Car updated successfully",
      affectedRows: result.affectedRows
    });

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { success: false, error: "Database Error" },
      { status: 500 }
    );
  } finally {
    if (db) db.release();
  }
}

export async function DELETE(request) {
  let db;
  try {
    const guard = await requireRole(['owner', 'admin']);
    if (guard.error) return guard.error;

    const { car_code } = await request.json();

    if (!car_code) {
      return NextResponse.json(
        { error: "Car code is required" },
        { status: 400 }
      );
    }

    db = await pool.getConnection();

    const checkQuery = `SELECT * FROM car WHERE car_code = ?`;
    const [existingData] = await db.execute(checkQuery, [car_code]);

    if (existingData.length === 0) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      );
    }

    if (guard.role === 'owner' && existingData[0].owner_id !== guard.session.id) {
      return NextResponse.json(
        { error: "You can only delete your own cars" },
        { status: 403 }
      );
    }

    const deleteQuery = `DELETE FROM car WHERE car_code = ?`;
    const [result] = await db.execute(deleteQuery, [car_code]);

    return NextResponse.json({
      success: true,
      message: "Car deleted successfully",
      affectedRows: result.affectedRows
    });

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({
      error: "Error"
    }, { status: 500 });
  } finally {
    if (db) db.release();
  }
}
