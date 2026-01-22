import { NextRequest, NextResponse } from 'next/server';
import { cancelSubscriptionAction } from '@/app/actions/subscriptionActions';

export async function PUT(request: NextRequest, { params }: { params: { subscriptionId: string } }) {
  try {
    const { reason } = await request.json();
    await cancelSubscriptionAction(params.subscriptionId, reason);
    return NextResponse.json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
