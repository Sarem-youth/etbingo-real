import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const registerSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Check if database is available
    try {
      await db.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { phoneNumber, password, name, email } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { phoneNumber },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        phoneNumber,
        password: hashedPassword,
        name,
        email,
        role: UserRole.PLAYER,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phoneNumber,
    });

    // Get signup bonus from system settings or use default
    const signupBonus = 20; // Default 20 ETB

    // Add bonus balance
    await db.user.update({
      where: { id: user.id },
      data: { bonusBalance: signupBonus },
    });

    // Record bonus transaction
    await db.transaction.create({
      data: {
        userId: user.id,
        type: 'BONUS',
        amount: signupBonus,
        status: 'COMPLETED',
        description: 'Signup bonus',
      },
    });

    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        balance: user.balance,
        bonusBalance: user.bonusBalance,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}