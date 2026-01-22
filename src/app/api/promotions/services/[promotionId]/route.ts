import { NextRequest, NextResponse } from 'next/server';
import { getServicePromotionAction, updateServicePromotionAction, deleteServicePromotionAction } from '@/app/actions/promotionActions';

export async function GET(request: NextRequest, { params }: { params: { promotionId: string } }) {
  try {
    const promotion = await getServicePromotionAction(params.promotionId);
    if (!promotion) {
      return NextResponse.json({ error: 'Service promotion not found' }, { status: 404 });
    }
    return NextResponse.json(promotion);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get service promotion';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { promotionId: string } }) {
  try {
    const body = await request.json();
    const updatedPromotion = await updateServicePromotionAction(params.promotionId, body);
    return NextResponse.json(updatedPromotion);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update service promotion';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { promotionId: string } }) {
  try {
    await deleteServicePromotionAction(params.promotionId);
    return NextResponse.json({ message: 'Service promotion deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete service promotion';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
