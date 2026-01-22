import { NextRequest, NextResponse } from 'next/server';
import { getEffectiveScheduleAction } from '@/app/actions/salonActions';

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }

  try {
    const effectiveSchedule = await getEffectiveScheduleAction(params.salonId, date);
    return NextResponse.json(effectiveSchedule);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get effective schedule';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
