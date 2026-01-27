import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'gofit-dev-secret-change-in-production';
const TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  gymId: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  gymId: string;
  avatar: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('gofit-token')?.value;
  
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      gymId: true,
      avatar: true,
      isActive: true,
    },
  });
  
  if (!user || !user.isActive) return null;
  
  return user;
}

export async function requireAuth(allowedRoles?: Role[]): Promise<AuthUser> {
  const user = await getSession();
  
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  
  return user;
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      gymId: true,
      avatar: true,
      passwordHash: true,
      isActive: true,
    },
  });
  
  if (!user || !user.isActive) return null;
  
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return null;
  
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    gymId: user.gymId,
  });
  
  const { passwordHash, ...userWithoutPassword } = user;
  
  return { user: userWithoutPassword, token };
}
