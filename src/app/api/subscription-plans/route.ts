import { NextRequest, NextResponse } from 'next/server';
import {
  createSubscriptionPlanAction,
  getAllSubscriptionPlansAction,
  getActiveSubscriptionPlansAction,
} from '@/app/actions/subscriptionActions';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('activeOnly');

  try {
    const plans = activeOnly === 'true'
      ? await getActiveSubscriptionPlansAction()
      : await getAllSubscriptionPlansAction();
    return NextResponse.json(plans);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get subscription plans';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, ...data } = body;
    const newPlan = await createSubscriptionPlanAction(planId, data);
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription plan';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
