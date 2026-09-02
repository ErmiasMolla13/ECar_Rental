import pool from "@/app/libs/mysql";
import { NextResponse } from "next/server";
import { requireRole } from "@/app/libs/authGuard";

export async function GET(request) {
    let db;

    try {
        const guard = await requireRole(['admin', 'owner']);
        if (guard.error) return guard.error;

        const searchParams = request.nextUrl.searchParams;
        const credential_id = searchParams.get("credential_id");
        const credential_name = searchParams.get("credential_name");

        db = await pool.getConnection();

        // NOTE: this previously queried the unrelated `car_review` table
        // (copy/paste bug) - fixed to query `owner_credential`.
        let query = "SELECT * FROM owner_credential";
        let params = [];

        // An owner may only ever look up their own credentials.
        const owner_id = guard.role === 'owner' ? guard.session.id : searchParams.get('owner_id');

        if (credential_id && credential_name) {
            query = "SELECT * FROM owner_credential WHERE credential_id=? AND credential_name=?";
            params = [credential_id, credential_name];
        } else if (credential_id) {
            query = "SELECT * FROM owner_credential WHERE credential_id=?";
            params = [credential_id];
        } else if (credential_name) {
            query = "SELECT * FROM owner_credential WHERE credential_name=?";
            params = [credential_name];
        }

        if (owner_id) {
            query += (params.length ? " AND" : " WHERE") + " owner_id=?";
            params.push(owner_id);
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
        const guard = await requireRole('owner');
        if (guard.error) return guard.error;

        const incoming_data = await request.json();

        if (!incoming_data.credential_name || !incoming_data.file_upload_path) {
            return NextResponse.json(
                { error: "credential_name and file_upload_path are required" },
                { status: 400 }
            );
        }

        db = await pool.getConnection();

        const query = `INSERT INTO owner_credential(credential_name, file_upload_path, owner_id) VALUES (?,?,?)`;

        // owner_id always comes from the session, never the request body.
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
