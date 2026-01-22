import { NextRequest, NextResponse } from 'next/server';
import { deleteSalonAvatarAction } from '@/app/actions/storageActions';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { storagePath } = body;
    
    if (!storagePath) {
      return NextResponse.json({ error: 'storagePath is required' }, { status: 400 });
    }

    await deleteSalonAvatarAction(storagePath);
    return NextResponse.json({ message: 'Salon avatar deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete salon avatar';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
