import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { tag, secret } = body;

    if (!tag) {
      return NextResponse.json(
        { success: false, message: 'Tag is required' },
        { status: 400 }
      );
    }

    if (secret !== process.env.NEXT_PUBLIC_REVALIDATION_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Invalid secret' },
        { status: 401 }
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
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
