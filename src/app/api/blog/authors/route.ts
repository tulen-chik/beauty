import { NextRequest, NextResponse } from 'next/server';
import { listBlogAuthorsAction, createBlogAuthorAction } from '@/app/actions/blogActions';

export async function GET(request: NextRequest) {
  try {
    const authors = await listBlogAuthorsAction();
    return NextResponse.json(authors);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get authors';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorId, ...data } = body;
    const newAuthor = await createBlogAuthorAction(authorId, data);
    return NextResponse.json(newAuthor, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create author';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
