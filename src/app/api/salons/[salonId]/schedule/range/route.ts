import { NextRequest, NextResponse } from 'next/server';
import { getScheduleForDateRangeAction } from '@/app/actions/salonActions';

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate parameters are required' }, { status: 400 });
  }

  try {
    const scheduleRange = await getScheduleForDateRangeAction(params.salonId, startDate, endDate);
    return NextResponse.json(scheduleRange);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get schedule for date range';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
