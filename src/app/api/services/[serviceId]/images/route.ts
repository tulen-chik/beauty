import { NextRequest, NextResponse } from 'next/server';
import { uploadServiceImageAction, getServiceImagesAction } from '@/app/actions/storageActions';

export async function POST(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const newImage = await uploadServiceImageAction(params.serviceId, file);
    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const images = await getServiceImagesAction(params.serviceId);
    return NextResponse.json(images);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get images';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
