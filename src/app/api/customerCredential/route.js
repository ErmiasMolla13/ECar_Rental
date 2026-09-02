import pool from "@/app/libs/mysql";
import { NextResponse } from "next/server";
import { requireRole } from "@/app/libs/authGuard";

export async function GET(request) {
    let db;

    try {
        const guard = await requireRole(['admin', 'customer']);
        if (guard.error) return guard.error;

        const searchParams = request.nextUrl.searchParams;
        const credential_id = searchParams.get("credential_id");
        const credential_name = searchParams.get("credential_name");

        db = await pool.getConnection();

        let query = "SELECT * FROM customer_credential";
        let params = [];

       
        const custm_id = guard.role === 'customer' ? guard.session.id : searchParams.get('custm_id');

        if (credential_id && credential_name) {
            query = "SELECT * FROM customer_credential WHERE credential_id=? AND credential_name=?";
            params = [credential_id, credential_name];
        } else if (credential_id) {
            query = "SELECT * FROM customer_credential WHERE credential_id=?";
            params = [credential_id];
        } else if (credential_name) {
            query = "SELECT * FROM customer_credential WHERE credential_name=?";
            params = [credential_name];
        }

        if (custm_id) {
            query += (params.length ? " AND" : " WHERE") + " custm_id=?";
            params.push(custm_id);
        } else if (guard.role !== 'admin') {
            
            return NextResponse.json([]);
        }

        const [rows] = await db.execute(query, params);

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Database error:", error);
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

        if (!incoming_data.credential_name || !incoming_data.file_upload_path) {
            return NextResponse.json(
                { error: "credential_name and file_upload_path are required" },
                { status: 400 }
            );
        }

        db = await pool.getConnection();

        const query = `INSERT INTO customer_credential(credential_name, file_upload_path, custm_id) VALUES (?,?,?)`;

        const params = [
            incoming_data.credential_name,
            incoming_data.file_upload_path,
            guard.session.id
        ];

        const [rows] = await db.execute(query, params);
        return NextResponse.json(rows);

    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Database Error" }, { status: 500 });
    } finally {
        if (db) db.release();
    }
}
