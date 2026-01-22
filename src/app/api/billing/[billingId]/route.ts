import { NextRequest, NextResponse } from 'next/server';
import {
  getBillingAction,
  updateBillingAction,
} from '@/app/actions/subscriptionActions';

export async function GET(request: NextRequest, { params }: { params: { billingId: string } }) {
  try {
    const billing = await getBillingAction(params.billingId);
    if (!billing) {
      return NextResponse.json({ error: 'Billing record not found' }, { status: 404 });
    }
    return NextResponse.json(billing);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get billing record';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { billingId: string } }) {
  try {
    const body = await request.json();
    const updatedBilling = await updateBillingAction(params.billingId, body);
    return NextResponse.json(updatedBilling);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update billing record';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
