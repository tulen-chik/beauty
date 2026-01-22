import { NextRequest, NextResponse } from 'next/server';
import { getServicePromotionPlanAction, updateServicePromotionPlanAction, deleteServicePromotionPlanAction } from '@/app/actions/promotionActions';

export async function GET(request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    const plan = await getServicePromotionPlanAction(params.planId);
    if (!plan) {
      return NextResponse.json({ error: 'Service promotion plan not found' }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get service promotion plan';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    const body = await request.json();
    const updatedPlan = await updateServicePromotionPlanAction(params.planId, body);
    return NextResponse.json(updatedPlan);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update service promotion plan';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    await deleteServicePromotionPlanAction(params.planId);
    return NextResponse.json({ message: 'Service promotion plan deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete service promotion plan';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
