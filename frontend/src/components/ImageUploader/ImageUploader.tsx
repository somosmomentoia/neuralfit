'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './ImageUploader.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ImageUploaderProps {
  currentImage?: string | null;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  aspectRatio?: number;
  maxSizeMB?: number;
  uploadEndpoint?: string;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageUploader({
  currentImage,
  onImageUploaded,
  onImageRemoved,
  aspectRatio = 16 / 9,
  maxSizeMB = 10,
  uploadEndpoint = '/upload/benefit-image',
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`La imagen no puede superar los ${maxSizeMB}MB`);
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
    const initialCrop = centerAspectCrop(width, height, aspectRatio);
    setCrop(initialCrop);
    
    // También establecer completedCrop inicial para que funcione sin mover el crop
    const scaleX = naturalWidth / width;
    const scaleY = naturalHeight / height;
    if (initialCrop.unit === '%') {
      setCompletedCrop({
        x: (initialCrop.x / 100) * width,
        y: (initialCrop.y / 100) * height,
        width: (initialCrop.width / 100) * width,
        height: (initialCrop.height / 100) * height,
        unit: 'px',
      });
    }
  }, [aspectRatio]);

  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9);
    });
  }, [completedCrop]);

  const handleUpload = async () => {
    console.log('🔄 handleUpload called');
    console.log('selectedFile:', selectedFile);
    console.log('completedCrop:', completedCrop);
    
    if (!selectedFile) {
      setError('No hay archivo seleccionado');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let imageToUpload: Blob | File = selectedFile;
      
      // Intentar obtener imagen cropeada
      console.log('🔄 Getting cropped image...');
      const croppedBlob = await getCroppedImg();
      console.log('croppedBlob:', croppedBlob);
      
      if (croppedBlob) {
        imageToUpload = croppedBlob;
      }
      
      console.log('📤 Sending to server...');
      const formData = new FormData();
      formData.append('image', imageToUpload, 'benefit-image.jpg');

      // Obtener token de localStorage (igual que en apiFetch)
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}${uploadEndpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir la imagen');
      }

      // Si la URL ya es completa (Cloudinary), usarla directamente
      // Si es relativa (/uploads/...), construir URL completa
      const fullImageUrl = data.imageUrl.startsWith('http') 
        ? data.imageUrl 
        : `${API_URL.replace('/api', '')}${data.imageUrl}`;
      onImageUploaded(fullImageUrl);
      
      // Limpiar estado
      setShowCropper(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setShowCropper(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    if (onImageRemoved) {
      onImageRemoved();
    }
  };

  return (
    <div className={styles.container}>
      {/* Vista actual de imagen o botón de subir */}
      {!showCropper && (
        <>
          {currentImage ? (
            <div className={styles.currentImage}>
              <img src={currentImage} alt="Imagen actual" />
              <div className={styles.imageActions}>
                <button 
                  type="button"
                  className={styles.changeBtn}
                  onClick={() => inputRef.current?.click()}
                >
                  Cambiar
                </button>
                <button 
                  type="button"
                  className={styles.removeBtn}
                  onClick={handleRemove}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <div 
              className={styles.uploadArea}
              onClick={() => inputRef.current?.click()}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <span>Haz clic para subir una imagen</span>
              <small>Máximo {maxSizeMB}MB • JPG, PNG, WebP</small>
            </div>
          )}
        </>
      )}

      {/* Modal de Cropper */}
      {showCropper && previewUrl && (
        <div className={styles.cropperModal}>
          <div className={styles.cropperContent}>
            <h3>Ajustar imagen</h3>
            <p className={styles.cropperHint}>Arrastra para encuadrar la imagen</p>
            
            <div className={styles.cropperWrapper}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                className={styles.reactCrop}
              >
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="Preview"
                  onLoad={onImageLoad}
                  className={styles.cropImage}
                />
              </ReactCrop>
            </div>

            <div className={styles.cropperActions}>
              <button 
                type="button"
                className={styles.cancelBtn}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancel(); }}
                disabled={uploading}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className={styles.uploadBtn}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUpload(); }}
                disabled={uploading}
              >
                {uploading ? 'Subiendo...' : 'Guardar imagen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
      />

      {/* Error */}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
