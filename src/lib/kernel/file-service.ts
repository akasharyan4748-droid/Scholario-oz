/**
 * SCHOLARIO-OS — Enterprise Unified File & Storage Service Abstraction
 * Handles file validation, storage provider integration, OCR processing, and document metadata.
 */

export type FileCategory =
  | 'STUDENT_PHOTO'
  | 'TEACHER_AVATAR'
  | 'ADMISSION_DOC'
  | 'TRANSFER_CERTIFICATE'
  | 'FEE_RECEIPT'
  | 'EXAM_PAPER'
  | 'CIRCULAR_ATTACHMENT'
  | 'SYSTEM_EXPORT';

export interface FileMetadata {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  category: FileCategory;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  tenantId: string;
}

export class FileService {
  private allowedMimeTypes: Set<string> = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]);

  public validateFile(file: { name: string; size: number; type: string }): { isValid: boolean; error?: string } {
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'File size exceeds maximum permitted limit of 10MB.' };
    }
    if (!this.allowedMimeTypes.has(file.type) && !file.name.endsWith('.csv')) {
      return { isValid: false, error: 'Unsupported file format. Please upload JPG, PNG, WEBP, PDF, or XLSX.' };
    }
    return { isValid: true };
  }

  public createFileMetadata(
    filename: string,
    mimeType: string,
    sizeBytes: number,
    category: FileCategory,
    uploadedBy: string,
    tenantId: string
  ): FileMetadata {
    return {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      filename,
      mimeType,
      sizeBytes,
      category,
      url: `/public/uploads/${category.toLowerCase()}/${filename}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
      tenantId,
    };
  }
}

export const fileService = new FileService();
