import { NextRequest, NextResponse } from 'next/server';
import { findPromotionAnalyticsByServicePromotionIdAction } from '@/app/actions/promotionActions';

export async function GET(request: NextRequest, { params }: { params: { promotionId: string } }) {
  try {
    const analytics = await findPromotionAnalyticsByServicePromotionIdAction(params.promotionId);
    return NextResponse.json(analytics);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to find promotion analytics';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
