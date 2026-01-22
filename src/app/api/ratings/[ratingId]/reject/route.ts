import { NextRequest, NextResponse } from 'next/server';
import { rejectSalonRatingAction } from '@/app/actions/ratingActions';

export async function PUT(request: NextRequest, { params }: { params: { ratingId: string } }) {
  try {
    const { reason } = await request.json();
    if (!reason) {
      return NextResponse.json({ error: 'Reason for rejection is required' }, { status: 400 });
    }
    await rejectSalonRatingAction(params.ratingId, reason);
    return NextResponse.json({ message: 'Rating rejected successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reject rating';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
