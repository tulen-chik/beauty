import { NextRequest, NextResponse } from 'next/server';
import {
  createServiceCategoryAction,
  getRandomServiceCategoriesAction,
} from '@/app/actions/serviceCategoryActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, ...data } = body;
    const newCategory = await createServiceCategoryAction(categoryId, data);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');

  try {
    const categories = await getRandomServiceCategoriesAction(limit ? parseInt(limit) : undefined);
    return NextResponse.json(categories);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get random categories';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
