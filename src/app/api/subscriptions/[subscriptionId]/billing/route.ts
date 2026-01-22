import { NextRequest, NextResponse } from 'next/server';
import { getBillingBySubscriptionIdAction } from '@/app/actions/subscriptionActions';

export async function GET(request: NextRequest, { params }: { params: { subscriptionId: string } }) {
  try {
    const billingRecords = await getBillingBySubscriptionIdAction(params.subscriptionId);
    return NextResponse.json(billingRecords);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get billing records';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
