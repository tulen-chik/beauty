import { NextRequest, NextResponse } from 'next/server';
import {
  createAppointmentAction,
  getAppointmentsBySalonAction,
} from '@/app/actions/appointmentActions';
import { AppointmentStatus } from '@/types/database';

export async function POST(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    const body = await request.json();
    const { appointmentId, ...data } = body;
    const newAppointment = await createAppointmentAction(params.salonId, appointmentId, data);
    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create appointment';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  const { searchParams } = new URL(request.url);
  const options = {
    startAt: searchParams.get('startAt') || undefined,
    endAt: searchParams.get('endAt') || undefined,
    status: searchParams.get('status') as AppointmentStatus || undefined,
    employeeId: searchParams.get('employeeId') || undefined,
    serviceId: searchParams.get('serviceId') || undefined,
    customerUserId: searchParams.get('customerUserId') || undefined,
  };

  try {
    const appointments = await getAppointmentsBySalonAction(params.salonId, options);
    return NextResponse.json(appointments);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get appointments';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
