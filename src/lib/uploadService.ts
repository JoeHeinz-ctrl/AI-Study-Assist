import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export interface UploadResult {
  filename: string;
  originalName: string;
  filepath: string;
  size: number;
  type: string;
}

export class UploadService {
  private static getUploadDir() {
    // Use environment variable or default path to avoid static path resolution
    return process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  }

  private static MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ];

  static async uploadFile(file: File): Promise<UploadResult> {
    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Ensure upload directory exists
    const uploadDir = this.getUploadDir();
    await this.ensureUploadDir(uploadDir);

    // Generate unique filename
    const extension = this.getFileExtension(file.name);
    const filename = `${randomUUID()}.${extension}`;
    const filepath = join(uploadDir, filename);

    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    return {
      filename,
      originalName: file.name,
      filepath,
      size: file.size,
      type: this.getFileType(file.type)
    };
  }

  private static async ensureUploadDir(uploadDir: string): Promise<void> {
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }

  private static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private static getFileType(mimeType: string): string {
    switch (mimeType) {
      case 'application/pdf':
        return 'pdf';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return 'docx';
      case 'text/plain':
        return 'txt';
      case 'text/markdown':
        return 'md';
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      case 'application/vnd.ms-powerpoint':
        return 'pptx';
      default:
        return 'unknown';
    }
  }
}