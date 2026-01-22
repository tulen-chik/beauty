import { NextRequest, NextResponse } from 'next/server';
import {
  getSalonRatingHelpfulVotesByRatingAction,
  toggleSalonRatingHelpfulVoteAction,
} from '@/app/actions/ratingActions';

export async function GET(request: NextRequest, { params }: { params: { ratingId: string } }) {
  try {
    const votes = await getSalonRatingHelpfulVotesByRatingAction(params.ratingId);
    return NextResponse.json(votes);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get helpful votes';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { ratingId: string } }) {
  try {
    const { userId, isHelpful } = await request.json();
    if (!userId || isHelpful === undefined) {
      return NextResponse.json({ error: 'userId and isHelpful are required' }, { status: 400 });
    }
    await toggleSalonRatingHelpfulVoteAction(params.ratingId, userId, isHelpful);
    return NextResponse.json({ message: 'Vote toggled successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to toggle vote';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
