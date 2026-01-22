import { NextRequest, NextResponse } from 'next/server';
import { listBlogCategoriesAction, createBlogCategoryAction } from '@/app/actions/blogActions';

export async function GET(request: NextRequest) {
  try {
    const categories = await listBlogCategoriesAction();
    return NextResponse.json(categories);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get categories';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, ...data } = body;
    const newCategory = await createBlogCategoryAction(categoryId, data);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
