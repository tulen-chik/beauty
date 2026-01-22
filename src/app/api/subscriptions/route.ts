import { NextRequest, NextResponse } from 'next/server';
import {
  createSubscriptionAction,
  getExpiringSubscriptionsAction,
} from '@/app/actions/subscriptionActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, ...data } = body;
    const newSubscription = await createSubscriptionAction(subscriptionId, data);
    return NextResponse.json(newSubscription, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const expiring = searchParams.get('expiring');
  const daysAhead = searchParams.get('daysAhead');

  if (expiring === 'true') {
    try {
      const subscriptions = await getExpiringSubscriptionsAction(daysAhead ? parseInt(daysAhead) : undefined);
      return NextResponse.json(subscriptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get expiring subscriptions';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid or missing query parameters' }, { status: 400 });
}
