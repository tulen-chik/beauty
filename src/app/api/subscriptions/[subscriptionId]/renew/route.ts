import { NextRequest, NextResponse } from 'next/server';
import { renewSubscriptionAction } from '@/app/actions/subscriptionActions';

export async function PUT(request: NextRequest, { params }: { params: { subscriptionId: string } }) {
  try {
    const { newEndDate } = await request.json();
    if (!newEndDate) {
      return NextResponse.json({ error: 'newEndDate is required' }, { status: 400 });
    }
    await renewSubscriptionAction(params.subscriptionId, newEndDate);
    return NextResponse.json({ message: 'Subscription renewed successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to renew subscription';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
