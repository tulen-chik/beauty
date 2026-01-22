import { NextRequest, NextResponse } from 'next/server';
import { deleteBlogImageAction } from '@/app/actions/storageActions';

export async function DELETE(request: NextRequest, { params }: { params: { storagePath: string[] } }) {
  try {
    const storagePath = params.storagePath.join('/');
    await deleteBlogImageAction(storagePath);
    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
