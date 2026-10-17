import { timingSafeEqual } from 'crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// Called only by the backend (ttbackendflyio utils/refreshFrontendCache.js) after an edit is
// saved, so a link shared straight away shows fresh WhatsApp/Facebook previews.
// REVALIDATION_SECRET is server-only (never NEXT_PUBLIC_) and must match the backend's.
const TAG_PATTERN = /^(event|listing|thread|deal)-[a-f0-9]{24}$|^campaign-[a-z0-9-]{1,120}$/;

function hasValidSecret(request) {
  const expected = process.env.REVALIDATION_SECRET;
  const given = request.headers.get('x-revalidation-secret');
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  if (!hasValidSecret(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { tag } = body;

    if (typeof tag !== 'string' || !TAG_PATTERN.test(tag)) {
      return NextResponse.json(
        { success: false, message: 'A valid tag is required' },
        { status: 400 }
      );
    }

    revalidateTag(tag);

    return NextResponse.json({
      success: true,
      message: `Revalidated tag: ${tag}`,
      revalidated: true,
      now: Date.now(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { success: false, message: 'Revalidation failed' },
      { status: 500 }
    );
  }
}
