import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cookieNameForRole, verifySessionToken } from './session';

/**
 * Reads and verifies the session cookie for a given role.
 * Returns the decoded session payload (e.g. { id, email, role, ... }) or
 * null if there is no valid session.
 */
export async function getSession(role) {
  const cookieStore = await cookies();
  const cookieName = cookieNameForRole(role);
  if (!cookieName) return null;
  const token = cookieStore.get(cookieName)?.value;
  return verifySessionToken(token);
}

/**
 * Checks the request against a set of allowed roles (checking each role's
 * cookie in turn) and returns the first valid session found, plus which
 * role it matched.
 */
export async function getAnySession(roles) {
  for (const role of roles) {
    const session = await getSession(role);
    if (session) return { role, session };
  }
  return null;
}

/**
 * Use at the top of a route handler to enforce auth:
 *
 *   const guard = await requireRole('admin');
 *   if (guard.error) return guard.error;
 *   const { id, email } = guard.session;
 *
 * Accepts a single role string or an array of allowed roles.
 */
export async function requireRole(roleOrRoles) {
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  const match = await getAnySession(roles);

  if (!match) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      ),
      session: null,
      role: null,
    };
  }

  return { error: null, session: match.session, role: match.role };
}
