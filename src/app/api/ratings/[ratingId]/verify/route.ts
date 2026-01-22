import { NextRequest, NextResponse } from 'next/server';
import { markSalonRatingAsVerifiedAction } from '@/app/actions/ratingActions';

export async function PUT(request: NextRequest, { params }: { params: { ratingId: string } }) {
  try {
    await markSalonRatingAsVerifiedAction(params.ratingId);
    return NextResponse.json({ message: 'Rating marked as verified successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to mark rating as verified';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
