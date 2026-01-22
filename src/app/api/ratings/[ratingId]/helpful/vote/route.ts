import { NextRequest, NextResponse } from 'next/server';
import { hasUserVotedOnSalonRatingAction } from '@/app/actions/ratingActions';

export async function GET(request: NextRequest, { params }: { params: { ratingId: string } }) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
  }

  try {
    const vote = await hasUserVotedOnSalonRatingAction(params.ratingId, userId);
    return NextResponse.json(vote);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to check user vote';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
