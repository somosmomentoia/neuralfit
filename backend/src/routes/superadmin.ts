import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

const slugifyGymName = (value: string) => {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || `gym-${Date.now()}`;
};

const resolveUniqueGymSlug = async (prismaLike: any, rawSlug: string) => {
  const baseSlug = slugifyGymName(rawSlug);
  let slug = baseSlug;
  let suffix = 2;

  while (await prismaLike.gym.findFirst({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

router.use(authMiddleware);
router.use(requireRole('SUPERADMIN'));

router.get('/gyms', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const gyms = await (prisma.gym.findMany as any)({
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            documentNumber: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            users: true,
            branches: true,
            plans: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      gyms: gyms.map((gym: any) => ({
        id: gym.id,
        name: gym.name,
        slug: gym.slug,
        description: gym.description ?? null,
        logo: gym.logo ?? null,
        isPublic: gym.isPublic,
        createdAt: gym.createdAt,
        admins: gym.users,
        stats: gym._count,
      })),
    });
  } catch (error) {
    console.error('Error fetching superadmin gyms:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/gyms', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const {
      gymName,
      slug,
      description,
      logo,
      isPublic,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPhone,
      adminDocumentNumber,
      adminPassword,
      branchName,
      branchAddress,
      branchPhone,
      branchGoogleMapsUrl,
    } = req.body;

    if (!gymName || !adminFirstName || !adminLastName || !adminEmail || !adminDocumentNumber || !adminPassword) {
      return res.status(400).json({ error: 'Completa los datos obligatorios del gimnasio y del administrador' });
    }

    if (adminPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña del administrador debe tener al menos 6 caracteres' });
    }

    if ((branchName && !branchAddress) || (!branchName && branchAddress)) {
      return res.status(400).json({ error: 'Para crear una sucursal inicial debes completar nombre y dirección' });
    }

    const normalizedAdminEmail = String(adminEmail).trim().toLowerCase();
    const normalizedDocumentNumber = String(adminDocumentNumber).trim();

    const [existingEmail, existingDocument] = await Promise.all([
      prisma.user.findUnique({ where: { email: normalizedAdminEmail }, select: { id: true } }),
      prisma.user.findFirst({ where: { documentNumber: normalizedDocumentNumber }, select: { id: true } } as any),
    ]);

    if (existingEmail) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }

    if (existingDocument) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese DNI' });
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      const resolvedSlug = await resolveUniqueGymSlug(tx, slug || gymName);

      const gym = await tx.gym.create({
        data: {
          name: String(gymName).trim(),
          slug: resolvedSlug,
          description: description?.trim() || null,
          logo: logo?.trim() || null,
          isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
        },
      });

      const admin = await tx.user.create({
        data: {
          firstName: String(adminFirstName).trim(),
          lastName: String(adminLastName).trim(),
          email: normalizedAdminEmail,
          phone: adminPhone?.trim() || null,
          documentNumber: normalizedDocumentNumber,
          passwordHash,
          role: 'ADMIN',
          gymId: gym.id,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          documentNumber: true,
          role: true,
          gymId: true,
          createdAt: true,
        },
      } as any);

      const updatedGym = await tx.gym.update({
        where: { id: gym.id },
        data: { defaultClientAttributionUserId: admin.id },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          isPublic: true,
          createdAt: true,
        },
      } as any);

      let branch = null;
      if (branchName && branchAddress) {
        branch = await tx.branch.create({
          data: {
            name: String(branchName).trim(),
            address: String(branchAddress).trim(),
            phone: branchPhone?.trim() || null,
            googleMapsUrl: branchGoogleMapsUrl?.trim() || null,
            gymId: gym.id,
          },
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            googleMapsUrl: true,
          },
        });
      }

      return { gym: updatedGym, admin, branch };
    });

    return res.status(201).json({
      gym: result.gym,
      admin: result.admin,
      branch: result.branch,
      message: 'Gimnasio y administrador creados correctamente',
    });
  } catch (error) {
    console.error('Error creating gym from superadmin:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
