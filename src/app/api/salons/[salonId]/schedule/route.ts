import { NextRequest, NextResponse } from 'next/server';
import {
  getSalonScheduleAction,
  createSalonScheduleAction,
  updateSalonScheduleAction,
  deleteSalonScheduleAction,
} from '@/app/actions/salonActions';

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    const schedule = await getSalonScheduleAction(params.salonId);
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    return NextResponse.json(schedule);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get schedule' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    const body = await request.json();
    const newSchedule = await createSalonScheduleAction(params.salonId, body);
    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    const body = await request.json();
    const updatedSchedule = await updateSalonScheduleAction(params.salonId, body);
    return NextResponse.json(updatedSchedule);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    await deleteSalonScheduleAction(params.salonId);
    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
