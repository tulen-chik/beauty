import { NextRequest, NextResponse } from 'next/server';
import { createPromotionAnalyticsAction } from '@/app/actions/promotionActions';

export async function POST(request: NextRequest) {
  try {
    const { analyticsId, ...data } = await request.json();
    const newAnalytics = await createPromotionAnalyticsAction(analyticsId, data);
    return NextResponse.json(newAnalytics, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create promotion analytics';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
