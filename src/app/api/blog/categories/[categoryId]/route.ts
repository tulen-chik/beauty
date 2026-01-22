import { NextRequest, NextResponse } from 'next/server';
import { getBlogCategoryAction, updateBlogCategoryAction, deleteBlogCategoryAction } from '@/app/actions/blogActions';

export async function GET(request: NextRequest, { params }: { params: { categoryId: string } }) {
  try {
    const category = await getBlogCategoryAction(params.categoryId);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get category';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { categoryId: string } }) {
  try {
    const body = await request.json();
    const updatedCategory = await updateBlogCategoryAction(params.categoryId, body);
    return NextResponse.json(updatedCategory);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { categoryId: string } }) {
  try {
    await deleteBlogCategoryAction(params.categoryId);
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
