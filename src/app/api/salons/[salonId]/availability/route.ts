import { NextRequest, NextResponse } from 'next/server';
import { checkAppointmentAvailabilityAction } from '@/app/actions/appointmentActions';

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  const { searchParams } = new URL(request.url);
  const startAtIso = searchParams.get('startAtIso');
  const durationMinutes = searchParams.get('durationMinutes');
  const employeeId = searchParams.get('employeeId') || undefined;
  const excludeAppointmentId = searchParams.get('excludeAppointmentId') || undefined;

  if (!startAtIso || !durationMinutes) {
    return NextResponse.json({ error: 'startAtIso and durationMinutes are required' }, { status: 400 });
  }

  try {
    const isAvailable = await checkAppointmentAvailabilityAction(
      params.salonId,
      startAtIso,
      parseInt(durationMinutes),
      employeeId,
      excludeAppointmentId
    );
    return NextResponse.json({ isAvailable });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to check availability';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
