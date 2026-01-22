import { NextRequest, NextResponse } from 'next/server';
import {
  getAppointmentAction,
  updateAppointmentAction,
  deleteAppointmentAction,
} from '@/app/actions/appointmentActions';

export async function GET(
  request: NextRequest,
  { params }: { params: { salonId: string; appointmentId: string } }
) {
  try {
    const appointment = await getAppointmentAction(params.salonId, params.appointmentId);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    return NextResponse.json(appointment);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get appointment';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { salonId: string; appointmentId: string } }
) {
  try {
    const body = await request.json();
    const updatedAppointment = await updateAppointmentAction(params.salonId, params.appointmentId, body);
    return NextResponse.json(updatedAppointment);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update appointment';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { salonId: string; appointmentId: string } }
) {
  try {
    await deleteAppointmentAction(params.salonId, params.appointmentId);
    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete appointment';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
