import { NextRequest, NextResponse } from 'next/server';
import { approveSalonRatingAction } from '@/app/actions/ratingActions';

export async function PUT(request: NextRequest, { params }: { params: { ratingId: string } }) {
  try {
    await approveSalonRatingAction(params.ratingId);
    return NextResponse.json({ message: 'Rating approved successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to approve rating';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
