import { NextRequest, NextResponse } from 'next/server';
import {
  createSalonRatingResponseAction,
  getSalonRatingResponsesByRatingAction,
} from '@/app/actions/ratingActions';

export async function POST(request: NextRequest, { params }: { params: { ratingId: string } }) {
  try {
    const body = await request.json();
    const { responseId, ...data } = body;
    const newResponse = await createSalonRatingResponseAction(responseId, { ...data, ratingId: params.ratingId });
    return NextResponse.json(newResponse, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create response';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { ratingId: string } }) {
  try {
    const responses = await getSalonRatingResponsesByRatingAction(params.ratingId);
    return NextResponse.json(responses);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get responses';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
