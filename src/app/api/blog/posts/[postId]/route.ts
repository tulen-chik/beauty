import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostAction, updateBlogPostAction, deleteBlogPostAction } from '@/app/actions/blogActions';

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const post = await getBlogPostAction(params.postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get post';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const body = await request.json();
    const updatedPost = await updateBlogPostAction(params.postId, body);
    return NextResponse.json(updatedPost);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update post';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    await deleteBlogPostAction(params.postId);
    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete post';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
