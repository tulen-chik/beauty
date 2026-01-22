import { NextRequest, NextResponse } from 'next/server';
import { getSalonByIdAction, updateSalonAction, deleteSalonAction } from '@/app/actions/salonActions';

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    const salon = await getSalonByIdAction(params.salonId);
    if (!salon) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }
    return NextResponse.json(salon);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get salon' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    const body = await request.json();
    const updatedSalon = await updateSalonAction(params.salonId, body);
    return NextResponse.json(updatedSalon);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update salon' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    await deleteSalonAction(params.salonId);
    return NextResponse.json({ message: 'Salon deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete salon' }, { status: 500 });
  }
}
