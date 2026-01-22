import { NextRequest, NextResponse } from 'next/server';
import { getSalonAvatarAction } from '@/app/actions/salonActions';

export async function GET(request: NextRequest, { params }: { params: { salonId: string } }) {
  try {
    const avatar = await getSalonAvatarAction(params.salonId);
    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }
    return NextResponse.json(avatar);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get salon avatar' }, { status: 500 });
  }
}
