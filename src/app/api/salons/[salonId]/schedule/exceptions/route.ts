import { NextRequest, NextResponse } from 'next/server';
import {
  addScheduleExceptionAction,
  removeScheduleExceptionAction,
  getExceptionsInRangeAction,
  addMultipleExceptionsAction,
} from '@/app/actions/salonActions';

export async function POST(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    const body = await request.json();
    // Check if it's a single exception or multiple
    if (Array.isArray(body)) {
      const updatedSchedule = await addMultipleExceptionsAction(params.salonId, body);
      return NextResponse.json(updatedSchedule, { status: 201 });
    } else {
      const updatedSchedule = await addScheduleExceptionAction(params.salonId, body);
      return NextResponse.json(updatedSchedule, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add exception(s)' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { salonId: string } }) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }

  try {
    const updatedSchedule = await removeScheduleExceptionAction(params.salonId, date);
    return NextResponse.json(updatedSchedule);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove exception' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate parameters are required' }, { status: 400 });
  }

  try {
    const exceptions = await getExceptionsInRangeAction(params.salonId, startDate, endDate);
    return NextResponse.json(exceptions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get exceptions' }, { status: 500 });
  }
}
