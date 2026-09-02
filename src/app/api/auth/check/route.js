import { NextResponse } from 'next/server';
import { getAnySession } from '@/app/libs/authGuard';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  const rolesToCheck = role ? [role] : ['admin', 'owner', 'customer'];
  const match = await getAnySession(rolesToCheck);

  if (!match) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    role: match.role,
    user: {
      id: match.session.id,
      email: match.session.email,
    },
  });
}
