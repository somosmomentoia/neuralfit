import { PrismaClient } from '@prisma/client';
import { notifySubscriptionExpired } from '../services/notificationService';

export const CURRENT_SUBSCRIPTION_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED'] as const;

export const SUBSCRIPTION_STATUS_PRIORITY: Record<string, number> = {
  ACTIVE: 0,
  PENDING: 1,
  SUSPENDED: 2,
  EXPIRED: 3,
  CANCELLED: 4,
};

export function compareSubscriptions(a: { status: string; startDate?: Date | null; createdAt?: Date | null }, b: { status: string; startDate?: Date | null; createdAt?: Date | null }) {
  const priorityA = SUBSCRIPTION_STATUS_PRIORITY[a.status] ?? 99;
  const priorityB = SUBSCRIPTION_STATUS_PRIORITY[b.status] ?? 99;
  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }

  const dateA = new Date(a.startDate ?? a.createdAt ?? 0).getTime();
  const dateB = new Date(b.startDate ?? b.createdAt ?? 0).getTime();
  return dateB - dateA;
}

export function pickPreferredSubscription<T extends { status: string; startDate?: Date | null; createdAt?: Date | null }>(subscriptions: T[]) {
  return [...subscriptions].sort(compareSubscriptions)[0] ?? null;
}

export function addMonthsToDate(baseDate: Date, monthsCount: number) {
  const result = new Date(baseDate);
  result.setMonth(result.getMonth() + monthsCount);
  return result;
}

export function resolveRenewalStartDate(currentEndDate?: Date | null) {
  const now = new Date();
  if (currentEndDate && currentEndDate.getTime() > now.getTime()) {
    return new Date(currentEndDate);
  }

  return now;
}

export async function syncExpiredSubscriptions(
  prisma: PrismaClient,
  filters: {
    userId?: string;
    gymId?: string;
    subscriptionId?: string;
  } = {},
) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      ...(filters.subscriptionId ? { id: filters.subscriptionId } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.gymId ? { gymId: filters.gymId } : {}),
      status: { in: [...CURRENT_SUBSCRIPTION_STATUSES] },
      endDate: { not: null, lt: new Date() },
    },
    include: {
      gym: {
        select: { id: true, name: true },
      },
    },
  } as any);

  for (const subscription of subscriptions) {
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'EXPIRED',
        expiredNotifiedAt: (subscription as any).expiredNotifiedAt ?? new Date(),
      },
    } as any);

    if (!(subscription as any).expiredNotifiedAt) {
      await notifySubscriptionExpired(subscription.userId, (subscription as any).gym.name, (subscription as any).gym.id);
    }

    if (filters.userId && updated.userId === filters.userId) {
      await prisma.clientProfile.updateMany({
        where: { userId: filters.userId },
        data: { subscriptionStatus: 'EXPIRED' },
      });
    }
  }

  return subscriptions.length;
}
