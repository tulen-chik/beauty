import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmailAction } from '@/app/actions/userActions';

export async function GET(request: NextRequest, { params }: { params: { email: string } }) {
  try {
    const user = await getUserByEmailAction(params.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get user by email' }, { status: 500 });
  }
}
