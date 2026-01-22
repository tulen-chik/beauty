import { NextRequest, NextResponse } from 'next/server';
import {
  createSalonServiceAction,
  getSalonServicesPaginatedAction,
  getSalonServicesByCityPaginatedAction,
} from '@/app/actions/salonActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, ...data } = body;
    const newService = await createSalonServiceAction(serviceId, data);
    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit'));
  const startAfterKey = searchParams.get('startAfterKey') || undefined;
  const city = searchParams.get('city');

  if (!limit) {
    return NextResponse.json({ error: 'Limit parameter is required' }, { status: 400 });
  }

  try {
    let result;
    if (city) {
      result = await getSalonServicesByCityPaginatedAction({ city, limit, startAfterKey });
    } else {
      result = await getSalonServicesPaginatedAction({ limit, startAfterKey });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get services' }, { status: 500 });
  }
}
