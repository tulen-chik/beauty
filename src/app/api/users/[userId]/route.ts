import { NextRequest, NextResponse } from 'next/server';
import { readUserAction, updateUserAction, deleteUserAction } from '@/app/actions/userActions';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await readUserAction(params.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const body = await request.json();
    const updatedUser = await updateUserAction(params.userId, body);
    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await deleteUserAction(params.userId);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
