import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { tag } = body;

    if (!tag) {
      return NextResponse.json(
        { success: false, message: 'Tag is required' },
        { status: 400 }
      );
    }

    // TODO: Add proper authentication later
    // Removed secret check for isolation testing

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
