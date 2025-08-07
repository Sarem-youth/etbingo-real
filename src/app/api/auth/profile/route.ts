import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export const GET = withAuth(async (req, { userId }) => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        email: true,
        balance: true,
        bonusBalance: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});