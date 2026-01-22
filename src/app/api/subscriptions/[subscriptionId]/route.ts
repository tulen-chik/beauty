import { NextRequest, NextResponse } from 'next/server';
import {
  getSubscriptionAction,
  updateSubscriptionAction,
  deleteSubscriptionAction,
} from '@/app/actions/subscriptionActions';

export async function GET(request: NextRequest, { params }: { params: { subscriptionId: string } }) {
  try {
    const subscription = await getSubscriptionAction(params.subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    return NextResponse.json(subscription);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get subscription';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { subscriptionId: string } }) {
  try {
    const body = await request.json();
    const updatedSubscription = await updateSubscriptionAction(params.subscriptionId, body);
    return NextResponse.json(updatedSubscription);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update subscription';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { subscriptionId: string } }) {
  try {
    await deleteSubscriptionAction(params.subscriptionId);
    return NextResponse.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete subscription';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
