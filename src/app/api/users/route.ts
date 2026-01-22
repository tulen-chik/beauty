import { NextRequest, NextResponse } from 'next/server';
import { createUserAction, listUsersAction } from '@/app/actions/userActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...data } = body;
    const newUser = await createUserAction(userId, data);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const users = await listUsersAction();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}
