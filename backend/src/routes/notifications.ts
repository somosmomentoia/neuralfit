import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/notifications - Obtener notificaciones del usuario
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const userId = req.user!.id;
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    
    return res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/notifications/unread-count - Obtener cantidad de notificaciones no leídas
router.get('/unread-count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const userId = req.user!.id;
    
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    
    return res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/notifications/:id/read - Marcar notificación como leída
router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const userId = req.user!.id;
    const { id } = req.params;
    
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    
    return res.json({ notification: updated });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/notifications/read-all - Marcar todas las notificaciones como leídas
router.put('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const userId = req.user!.id;
    
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/notifications/:id - Eliminar una notificación
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const userId = req.user!.id;
    const { id } = req.params;
    
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    await prisma.notification.delete({ where: { id } });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/notifications - Eliminar todas las notificaciones leídas
router.delete('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const userId = req.user!.id;
    
    await prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
