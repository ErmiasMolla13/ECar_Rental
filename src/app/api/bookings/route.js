import { NextResponse } from 'next/server';
import pool from '@/app/libs/mysql';

export async function POST(request) {
  let connection;
  try {
    const data = await request.json();
    console.log("Received booking data:", data); 

    // Validate required fields
    const requiredFields = ['car_id', 'customer_name', 'email', 'pickup_date', 'return_date'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    //  Check if car exists and is available
    const [car] = await connection.execute(
      `SELECT * FROM car WHERE id = ?`,
      [data.car_id]
    );

    if (car.length === 0) {
      throw new Error('Car not found');
    }

    const bookingInfo = {
      customer_name: data.customer_name,
      email: data.email,
      pickup_date: data.pickup_date,
      return_date: data.return_date,
      total_price: data.total_price,
      rental_days: data.rental_days
    };

    console.log("Booking info to store:", bookingInfo); 

    const [updateResult] = await connection.execute(
      `UPDATE car 
       SET is_booked = 1, 
           booking_info = ?
       WHERE id = ?`,
      [JSON.stringify(bookingInfo), data.car_id]
    );

    console.log("Car update result:", updateResult);
    
    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings 
       (car_id, customer_name, email, pickup_date, return_date, total_price, rental_days)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.car_id,
        data.customer_name,
        data.email,
        data.pickup_date,
        data.return_date,
        data.total_price,
        data.rental_days
      ]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      bookingId: bookingResult.insertId,
      carId: data.car_id
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}