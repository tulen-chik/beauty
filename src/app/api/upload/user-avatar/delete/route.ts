import { NextRequest, NextResponse } from 'next/server';
import { deleteUserAvatarAction } from '@/app/actions/storageActions';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { storagePath } = body;
    
    if (!storagePath) {
      return NextResponse.json({ error: 'storagePath is required' }, { status: 400 });
    }

    await deleteUserAvatarAction(storagePath);
    return NextResponse.json({ message: 'User avatar deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete user avatar';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
