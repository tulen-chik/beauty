import { NextRequest, NextResponse } from 'next/server';
import { deleteRatingFileAction } from '@/app/actions/storageActions';

export async function DELETE(request: NextRequest, { params }: { params: { ratingId: string; storagePath: string[] } }) {
  try {
    const storagePath = params.storagePath.join('/');
    await deleteRatingFileAction(`ratingFiles/${params.ratingId}/${storagePath}`);
    return NextResponse.json({ message: 'Rating file deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete rating file';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
