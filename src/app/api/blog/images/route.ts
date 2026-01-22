import { NextRequest, NextResponse } from 'next/server';
import { uploadBlogImageAction } from '@/app/actions/storageActions';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const postId = formData.get('postId') as string;

    if (!file || !postId) {
      return NextResponse.json({ error: 'File and postId are required' }, { status: 400 });
    }

    const newImage = await uploadBlogImageAction(postId, file);
    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
