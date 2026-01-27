import { Router, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dm5vg7gdx',
  api_key: process.env.CLOUDINARY_API_KEY || '944364977436961',
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración de multer para almacenamiento temporal en memoria
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

// Helper para subir buffer a Cloudinary
const uploadToCloudinary = (buffer: Buffer, folder: string, options: object = {}): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `neuralfit/${folder}`,
        format: 'webp',
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as { secure_url: string; public_id: string });
      }
    ).end(buffer);
  });
};

// POST /api/upload/benefit-image - Subir imagen de beneficio
router.post('/benefit-image', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    console.log('📤 Upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    console.log('📁 File received:', req.file.originalname, req.file.size, 'bytes');

    // Procesar imagen con sharp
    const processedBuffer = await sharp(req.file.buffer)
      .resize(800, 450, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer();

    // Subir a Cloudinary
    const result = await uploadToCloudinary(processedBuffer, 'benefits', {
      transformation: [{ width: 800, height: 450, crop: 'fill' }],
    });

    console.log('✅ Image uploaded to Cloudinary:', result.secure_url);

    return res.json({ 
      success: true, 
      imageUrl: result.secure_url,
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

    // Procesar imagen con sharp - cuadrada para avatar
    const processedBuffer = await sharp(req.file.buffer)
      .rotate()
      .resize(200, 200, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer();

    // Subir a Cloudinary
    const result = await uploadToCloudinary(processedBuffer, 'avatars', {
      public_id: `avatar_${req.user!.id}`,
      overwrite: true,
    });

    console.log('✅ Avatar uploaded to Cloudinary:', result.secure_url);

    return res.json({ 
      success: true, 
      imageUrl: result.secure_url,
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

    // Procesar imagen con sharp - cuadrado para logos
    const processedBuffer = await sharp(req.file.buffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .webp({ quality: 90 })
      .toBuffer();

    // Subir a Cloudinary
    const result = await uploadToCloudinary(processedBuffer, 'logos');

    console.log('✅ Logo uploaded to Cloudinary:', result.secure_url);

    return res.json({ 
      success: true, 
      imageUrl: result.secure_url,
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

    // Procesar imagen con sharp - mantener buena calidad para documentos
    const processedBuffer = await sharp(req.file.buffer)
      .rotate()
      .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer();

    // Subir a Cloudinary
    const result = await uploadToCloudinary(processedBuffer, 'medical');

    console.log('✅ Medical clearance uploaded to Cloudinary:', result.secure_url);

    return res.json({ 
      success: true, 
      imageUrl: result.secure_url,
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
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL de imagen inválida' });
    }

    // Extraer public_id de la URL de Cloudinary
    if (imageUrl.includes('cloudinary.com')) {
      const parts = imageUrl.split('/');
      const filenameWithExt = parts[parts.length - 1];
      const filename = filenameWithExt.split('.')[0];
      const folder = parts[parts.length - 2];
      const publicId = `neuralfit/${folder}/${filename}`;
      
      await cloudinary.uploader.destroy(publicId);
      console.log('🗑️ Deleted from Cloudinary:', publicId);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting benefit image:', error);
    return res.status(500).json({ error: 'Error al eliminar la imagen' });
  }
});

export default router;
