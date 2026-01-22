import { NextRequest, NextResponse } from 'next/server';
import {
  createInvitationAction,
  getInvitationsByEmailAction,
  getInvitationsBySalonIdAction,
} from '@/app/actions/salonActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationId, ...data } = body;
    const newInvitation = await createInvitationAction(invitationId, data);
    return NextResponse.json(newInvitation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const salonId = searchParams.get('salonId');

  try {
    if (email) {
      const invitations = await getInvitationsByEmailAction(email);
      return NextResponse.json(invitations);
    } else if (salonId) {
      const invitations = await getInvitationsBySalonIdAction(salonId);
      return NextResponse.json(invitations);
    } else {
      return NextResponse.json({ error: 'Either email or salonId is required' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get invitations' }, { status: 500 });
  }
}
