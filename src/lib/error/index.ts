/**
 * SCHOLARIO-OS — Enterprise Error Handling Framework
 * Standardized error classes, formatting, user-safe error translation, and diagnostic reporting.
 */

export enum ErrorCategory {
  AUTHENTICATION = 'AUTH_ERROR',
  AUTHORIZATION = 'PERMISSION_DENIED',
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'RESOURCE_NOT_FOUND',
  NETWORK = 'NETWORK_FAILURE',
  SERVER = 'SERVER_INTERNAL',
  TIMEOUT = 'REQUEST_TIMEOUT',
}

export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly code: string;
  public readonly userMessage: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(options: {
    message: string;
    category?: ErrorCategory;
    code?: string;
    userMessage?: string;
    status?: number;
    details?: Record<string, unknown>;
  }) {
    super(options.message);
    this.name = 'AppError';
    this.category = options.category || ErrorCategory.SERVER;
    this.code = options.code || 'ERR_INTERNAL';
    this.userMessage = options.userMessage || 'An unexpected error occurred. Please try again or contact support.';
    this.status = options.status || 500;
    this.details = options.details;
  }
}

export function formatUserErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected system error occurred. Please refresh the page.';
}

export function logErrorDiagnostic(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[SCHOLARIO-ERROR] [${timestamp}] [Context: ${context || 'General'}]`, error);
}
