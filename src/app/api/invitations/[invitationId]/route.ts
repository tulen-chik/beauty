import { NextRequest, NextResponse } from 'next/server';
import {
  getInvitationByIdAction,
  updateInvitationAction,
  deleteInvitationAction,
} from '@/app/actions/salonActions';

export async function GET(request: NextRequest, { params }: { params: { invitationId: string } }) {
  try {
    const invitation = await getInvitationByIdAction(params.invitationId);
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }
    return NextResponse.json(invitation);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get invitation' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { invitationId: string } }) {
  try {
    const body = await request.json();
    const updatedInvitation = await updateInvitationAction(params.invitationId, body);
    return NextResponse.json(updatedInvitation);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { invitationId: string } }) {
  try {
    await deleteInvitationAction(params.invitationId);
    return NextResponse.json({ message: 'Invitation deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 });
  }
}
