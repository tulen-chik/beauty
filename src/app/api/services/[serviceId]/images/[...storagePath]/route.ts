import { NextRequest, NextResponse } from 'next/server';
import { deleteServiceImageAction } from '@/app/actions/storageActions';

export async function DELETE(request: NextRequest, { params }: { params: { serviceId: string; storagePath: string[] } }) {
  try {
    const storagePath = params.storagePath.join('/');
    await deleteServiceImageAction(`serviceImages/${params.serviceId}/${storagePath}`);
    return NextResponse.json({ message: 'Service image deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete service image';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
