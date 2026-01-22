import { NextRequest, NextResponse } from 'next/server';
import {
  getSubscriptionBySalonIdAction,
  getAllSubscriptionsBySalonIdAction,
} from '@/app/actions/subscriptionActions';

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all');

  try {
    if (all === 'true') {
      const subscriptions = await getAllSubscriptionsBySalonIdAction(params.salonId);
      return NextResponse.json(subscriptions);
    } else {
      const subscription = await getSubscriptionBySalonIdAction(params.salonId);
      if (!subscription) {
        return NextResponse.json({ error: 'Active subscription not found' }, { status: 404 });
      }
      return NextResponse.json(subscription);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get salon subscriptions';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
