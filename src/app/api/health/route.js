import { NextResponse } from 'next/server';
import pool from '@/app/libs/mysql';

export async function GET() {
  let db;
  try {
    db = await pool.getConnection();
    await db.query('SELECT 1');
    return NextResponse.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', db: 'unreachable' },
      { status: 503 }
    );
  } finally {
    if (db) db.release();
  }
}
