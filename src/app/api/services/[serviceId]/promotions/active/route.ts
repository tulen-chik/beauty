import { NextRequest, NextResponse } from 'next/server';
import { findActiveServicePromotionByServiceIdAction } from '@/app/actions/promotionActions';

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const promotion = await findActiveServicePromotionByServiceIdAction(params.serviceId);
    if (!promotion) {
      return NextResponse.json({ error: 'Active service promotion not found' }, { status: 404 });
    }
    return NextResponse.json(promotion);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to find active service promotion';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
