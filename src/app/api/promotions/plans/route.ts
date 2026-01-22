import { NextRequest, NextResponse } from 'next/server';
import { getAllServicePromotionPlansAction, createServicePromotionPlanAction } from '@/app/actions/promotionActions';

export async function GET() {
  try {
    const plans = await getAllServicePromotionPlansAction();
    return NextResponse.json(plans);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get service promotion plans';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { planId, ...data } = await request.json();
    const newPlan = await createServicePromotionPlanAction(planId, data);
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create service promotion plan';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
