import { NextRequest, NextResponse } from 'next/server';
import { createServicePromotionAction } from '@/app/actions/promotionActions';

export async function POST(request: NextRequest) {
  try {
    const { promotionId, ...data } = await request.json();
    const newPromotion = await createServicePromotionAction(promotionId, data);
    return NextResponse.json(newPromotion, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create service promotion';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
