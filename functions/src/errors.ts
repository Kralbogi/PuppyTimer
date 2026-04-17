// =============================================================================
// Error Response Standardization
// =============================================================================

import { HttpsError } from "firebase-functions/v2/https";

/**
 * Standard error response format sent to clients
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: number;
}

/**
 * Creates a standardized authentication error
 */
export function authError(message = "Authentication required"): HttpsError {
  return new HttpsError("unauthenticated", message);
}

/**
 * Creates a standardized permission denied error
 */
export function permissionError(message = "Permission denied"): HttpsError {
  return new HttpsError("permission-denied", message);
}

/**
 * Creates a standardized invalid argument error
 */
export function validationError(message: string): HttpsError {
  return new HttpsError("invalid-argument", message);
}

/**
 * Creates a standardized not found error
 */
export function notFoundError(resource: string): HttpsError {
  return new HttpsError("not-found", `${resource} not found`);
}

/**
 * Creates a standardized already exists error
 */
export function alreadyExistsError(resource: string): HttpsError {
  return new HttpsError("already-exists", `${resource} already exists`);
}

/**
 * Creates a standardized rate limited error
 */
export function rateLimitError(retryAfter?: number): HttpsError {
  let message = "Rate limit exceeded. Please try again later.";
  if (retryAfter) {
    message += ` Retry after ${retryAfter} seconds.`;
  }
  return new HttpsError("resource-exhausted", message);
}

/**
 * Creates a standardized server error
 */
export function serverError(message = "Internal server error"): HttpsError {
  return new HttpsError("internal", message);
}

/**
 * Creates a standardized unavailable error
 */
export function unavailableError(message = "Service temporarily unavailable"): HttpsError {
  return new HttpsError("unavailable", message);
}

/**
 * Safely serializes error for logging
 */
export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof HttpsError) {
    return {
      code: error.code,
      message: error.message,
      details: (error as any).details,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  return {
    message: String(error),
  };
}

/**
 * Creates standardized error response for HTTP handlers
 */
export function errorResponse(statusCode: number, error: HttpsError): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
    },
    timestamp: Date.now(),
  };
}
