import { NextRequest, NextResponse } from 'next/server';
import {
  readSalonRatingAction,
  updateSalonRatingAction,
  deleteSalonRatingAction,
} from '@/app/actions/ratingActions';

export async function GET(request: NextRequest, { params }: { params: { ratingId: string } }) {
  try {
    const rating = await readSalonRatingAction(params.ratingId);
    if (!rating) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 });
    }
    return NextResponse.json(rating);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get rating';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { ratingId: string } }) {
  try {
    const body = await request.json();
    const updatedRating = await updateSalonRatingAction(params.ratingId, body);
    return NextResponse.json(updatedRating);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update rating';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { ratingId: string } }) {
  try {
    await deleteSalonRatingAction(params.ratingId);
    return NextResponse.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete rating';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
