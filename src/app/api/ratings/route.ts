import { NextRequest, NextResponse } from 'next/server';
import {
  createSalonRatingAction,
  getSalonRatingsBySalonAction,
  getSalonRatingsByCustomerAction,
  getSalonRatingByAppointmentAction,
} from '@/app/actions/ratingActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ratingId, ...data } = body;
    const newRating = await createSalonRatingAction(ratingId, data);
    return NextResponse.json(newRating, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create rating';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get('salonId');
  const customerUserId = searchParams.get('customerUserId');
  const appointmentId = searchParams.get('appointmentId');

  try {
    if (salonId) {
      const ratings = await getSalonRatingsBySalonAction(salonId);
      return NextResponse.json(ratings);
    }
    if (customerUserId) {
      const ratings = await getSalonRatingsByCustomerAction(customerUserId);
      return NextResponse.json(ratings);
    }
    if (appointmentId) {
      const rating = await getSalonRatingByAppointmentAction(appointmentId);
      return NextResponse.json(rating);
    }
    return NextResponse.json({ error: 'Missing required query parameter (salonId, customerUserId, or appointmentId)' }, { status: 400 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get ratings';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
