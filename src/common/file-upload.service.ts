import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Multer } from 'multer';

@Injectable()
export class FileUploadService {
  // Konfigurasi multer untuk payment proofs
  static multerConfigPaymentProof = {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './uploads/payment-proofs';
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(
            'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP',
          ),
          false,
        );
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  };

  // Helper untuk generate URL dari file path
  generateFileUrl(filename: string, type: 'payment-proof' | 'field-image'): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3333';
    const folder = type === 'payment-proof' ? 'payment-proofs' : 'field-images';
    return `${baseUrl}/uploads/${folder}/${filename}`;
  }

  // Validasi file image
  validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP',
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Ukuran file maksimal 5MB');
    }
  }
}
