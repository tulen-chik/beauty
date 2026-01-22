import { NextRequest, NextResponse } from 'next/server';
import {
  getSalonServiceByIdAction,
  updateSalonServiceAction,
  deleteSalonServiceAction,
} from '@/app/actions/salonActions';

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const service = await getSalonServiceByIdAction(params.serviceId);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get service' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    const body = await request.json();
    const updatedService = await updateSalonServiceAction(params.serviceId, body);
    return NextResponse.json(updatedService);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { serviceId: string } }) {
  try {
    await deleteSalonServiceAction(params.serviceId);
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
