import { NextRequest, NextResponse } from 'next/server';
import { uploadRatingFileAction } from '@/app/actions/storageActions';

export async function POST(request: NextRequest, { params }: { params: { ratingId: string } }) {
  try {
    const body = await request.json();
    const { name, type, size, base64 } = body;
    
    if (!name || !type || !base64) {
      return NextResponse.json({ error: 'Missing required fields: name, type, base64' }, { status: 400 });
    }

    const result = await uploadRatingFileAction(params.ratingId, { name, type, size, base64 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload rating file';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
