import { NextRequest, NextResponse } from 'next/server';
import { deleteBlogImageAction } from '@/app/actions/storageActions';

export async function DELETE(request: NextRequest, { params }: { params: { postId: string; storagePath: string[] } }) {
  try {
    const storagePath = params.storagePath.join('/');
    await deleteBlogImageAction(`blog/images/${params.postId}/${storagePath}`);
    return NextResponse.json({ message: 'Blog image deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete blog image';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
