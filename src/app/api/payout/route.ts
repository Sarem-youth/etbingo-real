import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, roomId, winningCardId } = await request.json();

    // Validate required fields
    if (!userId || !amount || !roomId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate payout amount (25x the stake amount)
    const payoutAmount = amount;

    // Update user balance
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: payoutAmount
        }
      }
    });

    // Create transaction record
    const transaction = await db.transaction.create({
      data: {
        userId: userId,
        type: 'win',
        amount: payoutAmount,
        status: 'completed',
        description: `Bingo win - Room ${roomId}, Card ${winningCardId}`,
        reference: `win_${roomId}_${Date.now()}`
      }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Payout processed successfully',
      newBalance: updatedUser.balance,
      transactionId: transaction.id,
      payoutAmount: payoutAmount
    });

  } catch (error) {
    console.error('Payout processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}