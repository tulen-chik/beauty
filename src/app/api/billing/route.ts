import { NextRequest, NextResponse } from 'next/server';
import { createBillingAction } from '@/app/actions/subscriptionActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newBillingId = await createBillingAction(body);
    return NextResponse.json({ id: newBillingId }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create billing record';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
