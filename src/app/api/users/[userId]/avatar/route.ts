import { NextRequest, NextResponse } from 'next/server';
import { getUserAvatarAction } from '@/app/actions/userActions';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const avatar = await getUserAvatarAction(params.userId);
    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }
    return NextResponse.json(avatar);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get avatar' }, { status: 500 });
  }
}
