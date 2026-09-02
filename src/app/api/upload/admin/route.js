import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { requireRole } from '@/app/libs/authGuard';

// Only these are accepted, mapped to a fixed, known-safe extension - the
// client-supplied filename/extension is never trusted or reused.
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  // Previously anyone, logged in or not, could POST arbitrary files here
  // (including non-images) with no size limit and a client-controlled
  // filename - a path-traversal / arbitrary-file-write and disk-exhaustion
  // risk. Now restricted to authenticated admins/owners.
  const guard = await requireRole(['admin', 'owner']);
  if (guard.error) return guard.error;

  let file;
  try {
    const formData = await request.formData();
    file = formData.get('file');
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file received' }, { status: 400 });
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: 'Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 5MB.' },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Filename is fully server-generated (random + fixed extension from
    // the detected MIME type) - the original filename is discarded, which
    // also rules out path traversal via a crafted name like `../../x`.
    const filename = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${extension}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads/admin');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadDir, filename), buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/admin/${filename}`
    });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ error: 'Error saving file' }, { status: 500 });
  }
}
