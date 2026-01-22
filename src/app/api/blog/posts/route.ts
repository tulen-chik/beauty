import { NextRequest, NextResponse } from 'next/server';
import { listBlogPostsAction, createBlogPostAction } from '@/app/actions/blogActions';

export async function GET(request: NextRequest) {
  try {
    const posts = await listBlogPostsAction();
    return NextResponse.json(posts);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get posts';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, ...data } = body;
    const newPost = await createBlogPostAction(postId, data);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
