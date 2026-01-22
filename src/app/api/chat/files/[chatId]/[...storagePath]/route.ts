import { NextRequest, NextResponse } from 'next/server';
import { deleteChatFileAction } from '@/app/actions/storageActions';

export async function DELETE(request: NextRequest, { params }: { params: { chatId: string; storagePath: string[] } }) {
  try {
    const storagePath = params.storagePath.join('/');
    await deleteChatFileAction(`chatFiles/${params.chatId}/${storagePath}`);
    return NextResponse.json({ message: 'Chat file deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete chat file';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
