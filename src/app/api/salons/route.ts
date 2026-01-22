import { NextRequest, NextResponse } from 'next/server';
import { createSalonAction, getSalonsByCityPaginatedAction } from '@/app/actions/salonActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { salonId, ...data } = body;
    const newSalon = await createSalonAction(salonId, data);
    return NextResponse.json(newSalon, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create salon' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const limit = searchParams.get('limit');
  const startAfterKey = searchParams.get('startAfterKey');

  if (city && limit) {
    try {
      const salons = await getSalonsByCityPaginatedAction({
        city,
        limit: parseInt(limit),
        startAfterKey: startAfterKey || undefined,
      });
      return NextResponse.json(salons);
    } catch (error) {
      return NextResponse.json({ error: 'Failed to get salons by city' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
}
