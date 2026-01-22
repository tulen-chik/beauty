import { NextRequest, NextResponse } from 'next/server';
import { uploadBlogImageAction } from '@/app/actions/storageActions';

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await uploadBlogImageAction(params.postId, file);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload blog image';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
