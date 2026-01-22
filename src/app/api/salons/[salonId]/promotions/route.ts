import { NextRequest, NextResponse } from 'next/server';
import { findServicePromotionsBySalonAction } from '@/app/actions/promotionActions';

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    const promotions = await findServicePromotionsBySalonAction(params.salonId);
    return NextResponse.json(promotions);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to find service promotions by salon';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
