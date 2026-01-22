import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentsByUserAction } from '@/app/actions/appointmentActions';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const appointments = await getAppointmentsByUserAction(params.userId);
    return NextResponse.json(appointments);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get user appointments';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
