import { NextRequest, NextResponse } from 'next/server';
import { acceptInvitationAction } from '@/app/actions/salonActions';

export async function POST(request: NextRequest, { params }: { params: { invitationId: string } }) {
  try {
    const body = await request.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    await acceptInvitationAction(params.invitationId, userId);
    return NextResponse.json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to accept invitation';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
