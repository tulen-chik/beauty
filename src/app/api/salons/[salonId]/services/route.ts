import { NextRequest, NextResponse } from 'next/server';
import { getServicesBySalonAction, getSalonServicesBySalonPaginatedAction } from '@/app/actions/salonActions';

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');
  const startAfterKey = searchParams.get('startAfterKey');

  try {
    if (limit) {
      const services = await getSalonServicesBySalonPaginatedAction({
        salonId: params.salonId,
        limit: parseInt(limit),
        startAfterKey: startAfterKey || undefined,
      });
      return NextResponse.json(services);
    } else {
      const services = await getServicesBySalonAction(params.salonId);
      return NextResponse.json(services);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get services for salon' }, { status: 500 });
  }
}
