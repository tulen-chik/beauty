import { NextRequest, NextResponse } from 'next/server';
import { getBlogAuthorAction, updateBlogAuthorAction, deleteBlogAuthorAction } from '@/app/actions/blogActions';

export async function GET(request: NextRequest, { params }: { params: { authorId: string } }) {
  try {
    const author = await getBlogAuthorAction(params.authorId);
    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }
    return NextResponse.json(author);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get author';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { authorId: string } }) {
  try {
    const body = await request.json();
    const updatedAuthor = await updateBlogAuthorAction(params.authorId, body);
    return NextResponse.json(updatedAuthor);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update author';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { authorId: string } }) {
  try {
    await deleteBlogAuthorAction(params.authorId);
    return NextResponse.json({ message: 'Author deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete author';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
