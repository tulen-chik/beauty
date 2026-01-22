import { NextRequest, NextResponse } from 'next/server';
import {
  readSalonRatingResponseAction,
  updateSalonRatingResponseAction,
  deleteSalonRatingResponseAction,
} from '@/app/actions/ratingActions';

export async function GET(request: NextRequest, { params }: { params: { responseId: string } }) {
  try {
    const response = await readSalonRatingResponseAction(params.responseId);
    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }
    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { responseId: string } }) {
  try {
    const body = await request.json();
    const updatedResponse = await updateSalonRatingResponseAction(params.responseId, body);
    return NextResponse.json(updatedResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update response';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { responseId: string } }) {
  try {
    await deleteSalonRatingResponseAction(params.responseId);
    return NextResponse.json({ message: 'Response deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete response';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
