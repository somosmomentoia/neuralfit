import { Router, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Configuración de multer para almacenamiento temporal
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF).'));
    }
  },
});

// Asegurar que exista el directorio de uploads
const uploadsDir = path.join(__dirname, '../../uploads/benefits');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// POST /api/upload/benefit-image - Subir imagen de beneficio
router.post('/benefit-image', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    console.log('📤 Upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    console.log('📁 File received:', req.file.originalname, req.file.size, 'bytes');

    // Generar nombre único para el archivo
    const filename = `benefit_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
    const filepath = path.join(uploadsDir, filename);

    console.log('💾 Saving to:', filepath);

    // Procesar imagen con sharp - solo redimensionar (el crop ya viene del frontend)
    await sharp(req.file.buffer)
      .resize(800, 450, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    // Construir URL pública
    const imageUrl = `/uploads/benefits/${filename}`;

    console.log('✅ Image saved successfully:', imageUrl);

    return res.json({ 
      success: true, 
      imageUrl,
      message: 'Imagen subida correctamente' 
    });
  } catch (error) {
    console.error('❌ Error uploading benefit image:', error);
    return res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

// POST /api/upload/avatar - Subir foto de perfil de usuario
router.post('/avatar', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    console.log('📤 Avatar upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    console.log('📁 File received:', req.file.originalname, req.file.size, 'bytes');

    // Asegurar directorio de avatares
    const avatarDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const filename = `avatar_${req.user!.id}_${Date.now()}.webp`;
    const filepath = path.join(avatarDir, filename);

    console.log('💾 Saving to:', filepath);

    // Procesar imagen con sharp - cuadrada para avatar
    // .rotate() sin argumentos auto-corrige la orientación basándose en EXIF
    await sharp(req.file.buffer)
      .rotate()
      .resize(200, 200, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    // Construir URL pública
    const imageUrl = `/uploads/avatars/${filename}`;

    console.log('✅ Avatar saved successfully:', imageUrl);

    return res.json({ 
      success: true, 
      imageUrl,
      message: 'Avatar subido correctamente' 
    });
  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    return res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

// POST /api/upload/gym-logo - Subir logo de gimnasio
router.post('/gym-logo', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    console.log('📤 Logo upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    console.log('📁 File received:', req.file.originalname, req.file.size, 'bytes');

    // Asegurar directorio de logos
    const logosDir = path.join(__dirname, '../../uploads/logos');
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const filename = `logo_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
    const filepath = path.join(logosDir, filename);

    console.log('💾 Saving to:', filepath);

    // Procesar imagen con sharp - cuadrado para logos
    await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 90 })
      .toFile(filepath);

    // Construir URL pública
    const imageUrl = `/uploads/logos/${filename}`;

    console.log('✅ Logo saved successfully:', imageUrl);

    return res.json({ 
      success: true, 
      imageUrl,
      message: 'Logo subido correctamente' 
    });
  } catch (error) {
    console.error('❌ Error uploading gym logo:', error);
    return res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

// POST /api/upload/medical-clearance - Subir apto médico de cliente
router.post('/medical-clearance', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    console.log('📤 Medical clearance upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    console.log('📁 File received:', req.file.originalname, req.file.size, 'bytes');

    // Asegurar directorio de aptos médicos
    const medicalDir = path.join(__dirname, '../../uploads/medical');
    if (!fs.existsSync(medicalDir)) {
      fs.mkdirSync(medicalDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const filename = `medical_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
    const filepath = path.join(medicalDir, filename);

    console.log('💾 Saving to:', filepath);

    // Procesar imagen con sharp - mantener buena calidad para documentos
    // .rotate() sin argumentos auto-corrige la orientación basándose en EXIF
    await sharp(req.file.buffer)
      .rotate()
      .resize(1200, 1600, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 90 })
      .toFile(filepath);

    // Construir URL pública
    const imageUrl = `/uploads/medical/${filename}`;

    console.log('✅ Medical clearance saved successfully:', imageUrl);

    return res.json({ 
      success: true, 
      imageUrl,
      message: 'Apto médico subido correctamente' 
    });
  } catch (error) {
    console.error('❌ Error uploading medical clearance:', error);
    return res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

// DELETE /api/upload/benefit-image - Eliminar imagen de beneficio
router.delete('/benefit-image', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl || !imageUrl.startsWith('/uploads/benefits/')) {
      return res.status(400).json({ error: 'URL de imagen inválida' });
    }

    const filename = path.basename(imageUrl);
    const filepath = path.join(uploadsDir, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting benefit image:', error);
    return res.status(500).json({ error: 'Error al eliminar la imagen' });
  }
});

export default router;
