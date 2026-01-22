import { NextRequest, NextResponse } from 'next/server';
import { getServiceCategoriesBySalonIdAction } from '@/app/actions/serviceCategoryActions';

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    const categories = await getServiceCategoriesBySalonIdAction(params.salonId);
    return NextResponse.json(categories);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get categories for salon';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
