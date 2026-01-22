import { NextRequest, NextResponse } from 'next/server';
import { getSalonRatingHelpfulStatsAction } from '@/app/actions/ratingActions';

export async function GET(request: NextRequest, { params }: { params: { ratingId: string } }) {
  try {
    const stats = await getSalonRatingHelpfulStatsAction(params.ratingId);
    return NextResponse.json(stats);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get helpful stats';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
