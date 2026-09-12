import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer, { type FileFilterCallback, type StorageEngine } from 'multer';

import { type DocType } from '../types';

const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
const maxFileSize = Number(process.env.MAX_FILE_SIZE ?? 10) * 1024 * 1024;

fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Set(['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel']);

export function inferDocType(file: { originalName?: string; mimeType?: string }): DocType {
  const mime = file.mimeType?.toLowerCase() ?? '';
  const name = file.originalName?.toLowerCase() ?? '';

  if (mime.includes('csv') || name.endsWith('.csv')) {
    return 'csv';
  }

  return 'text';
}

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const mime = file.mimetype?.toLowerCase() ?? '';
  const name = file.originalname.toLowerCase();

  if (allowedMimeTypes.has(mime) || name.endsWith('.csv') || name.endsWith('.txt')) {
    cb(null, true);
    return;
  }

  cb(new Error('Only CSV and text files are allowed'));
};

const storage: StorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(uploadDir));
  },
  filename: (_req, file, cb) => {
    const originalName = file.originalname ?? 'upload';
    const inferredType = inferDocType({
      originalName,
      mimeType: file.mimetype,
    });
    const extension = path.extname(originalName) || (inferredType === 'csv' ? '.csv' : '.txt');
    cb(null, `${randomUUID()}${extension}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter,
});
