import { NextRequest, NextResponse } from 'next/server';
import { getUserSalonsAction, updateUserSalonsAction, createUserSalonsAction } from '@/app/actions/salonActions';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userSalons = await getUserSalonsAction(params.userId);
    if (!userSalons) {
      return NextResponse.json({ error: 'User salons not found' }, { status: 404 });
    }
    return NextResponse.json(userSalons);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get user salons' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const body = await request.json();
    const updatedUserSalons = await updateUserSalonsAction(params.userId, body);
    return NextResponse.json(updatedUserSalons);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user salons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
    try {
      const body = await request.json();
      const newUserSalons = await createUserSalonsAction(params.userId, body);
      return NextResponse.json(newUserSalons, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to create user salons' }, { status: 500 });
    }
  }
