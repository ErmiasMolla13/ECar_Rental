import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cookieNameForRole } from '@/app/libs/session';

export async function POST(request) {
  let role;
  try {
    const body = await request.json();
    role = body?.role;
  } catch {
    role = undefined;
  }

  const cookieStore = await cookies();
  const roles = role ? [role] : ['admin', 'owner', 'customer'];

  for (const r of roles) {
    const cookieName = cookieNameForRole(r);
    if (cookieName) cookieStore.delete(cookieName);
  }

  return NextResponse.json({ success: true });
}
