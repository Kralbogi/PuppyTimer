// =============================================================================
// Input Validation Utilities — Strict type checking & sanitization
// =============================================================================

import { HttpsError } from "firebase-functions/v2/https";

/**
 * Validates that a string is non-empty and within length limits
 */
export function validateString(
  value: unknown,
  field: string,
  minLength = 1,
  maxLength = 10000
): string {
  if (typeof value !== "string") {
    throw new HttpsError(
      "invalid-argument",
      `${field} must be a string`
    );
  }

  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    throw new HttpsError(
      "invalid-argument",
      `${field} must be at least ${minLength} characters`
    );
  }

  if (trimmed.length > maxLength) {
    throw new HttpsError(
      "invalid-argument",
      `${field} must not exceed ${maxLength} characters`
    );
  }

  return trimmed;
}

/**
 * Validates that a value is a valid enum choice
 */
export function validateEnum<T extends string>(
  value: unknown,
  field: string,
  allowedValues: readonly T[]
): T {
  if (!allowedValues.includes(value as T)) {
    throw new HttpsError(
      "invalid-argument",
      `${field} must be one of: ${allowedValues.join(", ")}`
    );
  }
  return value as T;
}

/**
 * Validates that a value is a valid Firebase UID
 */
export function validateUID(value: unknown, field: string = "uid"): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpsError("invalid-argument", `${field} is required`);
  }

  // Firebase UIDs are typically 28 characters alphanumeric
  if (!/^[a-zA-Z0-9]{20,}$/.test(value)) {
    throw new HttpsError("invalid-argument", `${field} is invalid`);
  }

  return value;
}

/**
 * Validates that a value is a valid email
 */
export function validateEmail(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "Email must be a string");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new HttpsError("invalid-argument", "Invalid email format");
  }

  return value.toLowerCase();
}

/**
 * Validates that a value is a positive number within range
 */
export function validateNumber(
  value: unknown,
  field: string,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): number {
  if (typeof value !== "number" || isNaN(value)) {
    throw new HttpsError("invalid-argument", `${field} must be a number`);
  }

  if (value < min || value > max) {
    throw new HttpsError(
      "invalid-argument",
      `${field} must be between ${min} and ${max}`
    );
  }

  return value;
}

/**
 * Validates that a value is a boolean
 */
export function validateBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new HttpsError("invalid-argument", `${field} must be a boolean`);
  }
  return value;
}

/**
 * Validates that a value is a valid base64 string
 */
export function validateBase64(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${field} must be a string`);
  }

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new HttpsError("invalid-argument", `${field} is not valid base64`);
  }

  // Check size (limit to 10MB)
  if (Buffer.byteLength(value, "base64") > 10 * 1024 * 1024) {
    throw new HttpsError(
      "invalid-argument",
      `${field} exceeds 10MB size limit`
    );
  }

  return value;
}

/**
 * Validates MIME type for images
 */
export function validateMediaType(value: unknown): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
  if (!allowed.includes(value as any)) {
    throw new HttpsError(
      "invalid-argument",
      `mediaType must be one of: ${allowed.join(", ")}`
    );
  }
  return value as any;
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeString(value: string): string {
  // Remove any HTML tags and dangerous characters
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[<>"/]/, "")
    .trim();
}

/**
 * Validates array of strings (e.g., messaging participant IDs)
 */
export function validateStringArray(
  value: unknown,
  field: string,
  minLength = 1,
  maxLength = 100
): string[] {
  if (!Array.isArray(value)) {
    throw new HttpsError("invalid-argument", `${field} must be an array`);
  }

  if (value.length < minLength || value.length > maxLength) {
    throw new HttpsError(
      "invalid-argument",
      `${field} must have ${minLength}-${maxLength} items`
    );
  }

  // Validate each item is a string
  return value.map((item, idx) => {
    if (typeof item !== "string") {
      throw new HttpsError(
        "invalid-argument",
        `${field}[${idx}] must be a string`
      );
    }
    return item;
  });
}

/**
 * Validates URL format
 */
export function validateUrl(value: unknown, field: string = "url"): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${field} must be a string`);
  }

  try {
    new URL(value);
    return value;
  } catch {
    throw new HttpsError("invalid-argument", `${field} is not a valid URL`);
  }
}
