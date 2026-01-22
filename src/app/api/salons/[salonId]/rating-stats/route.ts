import { NextRequest, NextResponse } from 'next/server';
import { getSalonRatingStatsAction } from '@/app/actions/ratingActions';

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    const stats = await getSalonRatingStatsAction(params.salonId);
    return NextResponse.json(stats);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get rating stats';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
