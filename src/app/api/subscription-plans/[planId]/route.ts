import { NextRequest, NextResponse } from 'next/server';
import {
  getSubscriptionPlanAction,
  updateSubscriptionPlanAction,
  deleteSubscriptionPlanAction,
} from '@/app/actions/subscriptionActions';

export async function GET(request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    const plan = await getSubscriptionPlanAction(params.planId);
    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get subscription plan';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    const body = await request.json();
    const updatedPlan = await updateSubscriptionPlanAction(params.planId, body);
    return NextResponse.json(updatedPlan);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update subscription plan';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    await deleteSubscriptionPlanAction(params.planId);
    return NextResponse.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete subscription plan';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
