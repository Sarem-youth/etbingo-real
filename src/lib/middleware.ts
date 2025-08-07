import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './auth';
import { UserRole } from '@prisma/client';

export function withAuth(handler: (req: NextRequest, context: { userId: string; role: UserRole }) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);
      
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      return await handler(req, { userId: payload.userId, role: payload.role });
    } catch (error) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
  };
}

export function withRole(allowedRoles: UserRole[]) {
  return function <T extends (...args: any[]) => any>(
    handler: T
  ): (
    req: NextRequest,
    context: { userId: string; role: UserRole }
  ) => ReturnType<T> {
    return async (req: NextRequest, context: { userId: string; role: UserRole }): ReturnType<T> => {
      if (!allowedRoles.includes(context.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) as ReturnType<T>;
      }
      return handler(req, context);
    };
  };
}