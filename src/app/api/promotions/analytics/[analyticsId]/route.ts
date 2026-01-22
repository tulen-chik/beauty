import { NextRequest, NextResponse } from 'next/server';
import { getPromotionAnalyticsAction, updatePromotionAnalyticsAction, deletePromotionAnalyticsAction } from '@/app/actions/promotionActions';

export async function GET(request: NextRequest, { params }: { params: { analyticsId: string } }) {
  try {
    const analytics = await getPromotionAnalyticsAction(params.analyticsId);
    if (!analytics) {
      return NextResponse.json({ error: 'Promotion analytics not found' }, { status: 404 });
    }
    return NextResponse.json(analytics);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get promotion analytics';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { analyticsId: string } }) {
  try {
    const body = await request.json();
    const updatedAnalytics = await updatePromotionAnalyticsAction(params.analyticsId, body);
    return NextResponse.json(updatedAnalytics);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update promotion analytics';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { analyticsId: string } }) {
  try {
    await deletePromotionAnalyticsAction(params.analyticsId);
    return NextResponse.json({ message: 'Promotion analytics deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete promotion analytics';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
