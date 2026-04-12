import { PrismaClient, Role } from '@prisma/client';

const ATTRIBUTION_ROLES: Role[] = ['ADMIN', 'PROFESSIONAL'];

export interface AttributionCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

export async function getGymAttributionCandidates(prisma: PrismaClient, gymId: string): Promise<AttributionCandidate[]> {
  return prisma.user.findMany({
    where: {
      gymId,
      role: { in: ATTRIBUTION_ROLES },
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
    orderBy: [
      { role: 'asc' },
      { firstName: 'asc' },
      { lastName: 'asc' },
    ],
  });
}

export async function validateGymAttributionUser(
  prisma: PrismaClient,
  gymId: string,
  userId: string | null | undefined,
): Promise<AttributionCandidate | null> {
  if (!userId) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      id: userId,
      gymId,
      role: { in: ATTRIBUTION_ROLES },
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  });
}

export async function resolveGymAttributionUserId(
  prisma: PrismaClient,
  gymId: string,
  fallbackUserId?: string | null,
): Promise<string | null> {
  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
  }) as ({ defaultClientAttributionUserId?: string | null } | null);

  const configuredUser = await validateGymAttributionUser(prisma, gymId, gym?.defaultClientAttributionUserId);
  if (configuredUser) {
    return configuredUser.id;
  }

  const fallbackUser = await validateGymAttributionUser(prisma, gymId, fallbackUserId);
  if (fallbackUser) {
    return fallbackUser.id;
  }

  const firstCandidate = await prisma.user.findFirst({
    where: {
      gymId,
      role: { in: ATTRIBUTION_ROLES },
      isActive: true,
    },
    select: { id: true },
    orderBy: [
      { role: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return firstCandidate?.id ?? null;
}
