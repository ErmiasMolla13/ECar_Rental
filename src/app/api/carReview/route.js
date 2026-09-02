import pool from "@/app/libs/mysql";
import { NextResponse } from "next/server";
import { requireRole } from "@/app/libs/authGuard";


export async function GET(request) {
    let db;

    try {
       const searchParams = request.nextUrl.searchParams;
       const review_id = searchParams.get("review_id");
       const review_score = searchParams.get("review_score");
       const car_id = searchParams.get("car_id");

       db = await pool.getConnection();

       let query = "SELECT * FROM car_review";
       let params = [];

       if (review_id && review_score) {
        query = "SELECT * FROM car_review WHERE review_id=? AND review_score=?";
        params = [review_id, review_score];
       } else if (car_id) {
        query = "SELECT * FROM car_review WHERE CAR_ID=? ORDER BY review_date DESC";
        params = [car_id];
       } else if (review_id) {
        query = "SELECT * FROM car_review WHERE review_id=?";
        params = [review_id];
       } else if (review_score) {
        query = "SELECT * FROM car_review WHERE review_score=?";
        params = [review_score];
       } else {
        query = "SELECT * FROM car_review";
       }
       const [rows] = await db.execute(query, params);

       return NextResponse.json(rows);
    } catch (error) {
        console.error("carReview GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    } finally {
        if (db) db.release();
    }
}

export async function POST(request) {
    let db;

    try {
        const guard = await requireRole('customer');
        if (guard.error) return guard.error;

        const incoming_data = await request.json();
        const car_id = incoming_data.car_id;
        const review_score = Number(incoming_data.review_score);
        const review = (incoming_data.review || '').trim();

        if (!car_id) {
            return NextResponse.json({ success: false, error: "car_id is required" }, { status: 400 });
        }

        if (!Number.isFinite(review_score) || review_score < 0.5 || review_score > 5) {
            return NextResponse.json(
                { success: false, error: "review_score must be between 0.5 and 5" },
                { status: 400 }
            );
        }

        const custm_id = guard.session.id;

        db = await pool.getConnection();

        const [carRows] = await db.execute("SELECT id FROM car WHERE id = ?", [car_id]);
        if (carRows.length === 0) {
            return NextResponse.json({ success: false, error: "Car not found" }, { status: 404 });
        }

        const [existing] = await db.execute(
            "SELECT review_id FROM car_review WHERE custm_id = ? AND CAR_ID = ?",
            [custm_id, car_id]
        );

        if (existing.length > 0) {
            await db.execute(
                "UPDATE car_review SET review = ?, review_score = ?, review_date = ? WHERE review_id = ?",
                [review, review_score, new Date(), existing[0].review_id]
            );
        } else {
            await db.execute(
                "INSERT INTO car_review (review, review_score, review_date, custm_id, CAR_ID) VALUES (?,?,?,?,?)",
                [review, review_score, new Date(), custm_id, car_id]
            );
        }

        const [[avgRow]] = await db.execute(
            "SELECT AVG(review_score) AS avg_score, COUNT(*) AS review_count FROM car_review WHERE CAR_ID = ?",
            [car_id]
        );

        const newAverage = avgRow.avg_score !== null ? Number(avgRow.avg_score) : review_score;

        await db.execute("UPDATE car SET rating = ? WHERE id = ?", [newAverage, car_id]);

        return NextResponse.json({
            success: true,
            rating: newAverage,
            reviewCount: avgRow.review_count,
        });
    } catch (error) {
        console.error("carReview POST error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    } finally {
        if (db) db.release();
    }
}
