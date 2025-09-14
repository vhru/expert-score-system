import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { dbOperations } from './database-adapter';
import { encryptData } from './encryption';

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  }
});

export async function saveFileToDatabase(
  originalName: string,
  filePath: string,
  fileSize: number,
  mimeType: string,
  encryptedInfo?: string,
  teamName?: string
): Promise<number> {
  try {
    const result = await dbOperations.files.create(originalName, filePath, fileSize, mimeType, encryptedInfo, teamName);
    return result.lastInsertRowid as number;
  } catch (error) {
    console.error('Failed to save file to database:', error);
    throw error;
  }
}

export async function getFileById(fileId: number) {
  try {
    return await dbOperations.files.findById(fileId);
  } catch (error) {
    console.error('Failed to get file:', error);
    return null;
  }
}

export async function getAllFiles() {
  try {
    return await dbOperations.files.findAll();
  } catch (error) {
    console.error('Failed to get files:', error);
    return [];
  }
}
