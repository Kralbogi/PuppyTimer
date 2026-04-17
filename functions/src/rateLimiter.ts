// =============================================================================
// Rate Limiter — Firestore-based rate limiting for API endpoints
// =============================================================================

import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";

const db = admin.firestore();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

/**
 * Predefined rate limit configs
 */
export const RATE_LIMITS = {
  // Chat: 5 messages per 5 minutes
  CHAT_MESSAGE: { maxRequests: 5, windowSeconds: 300 },
  // AI Analysis: 10 per hour
  AI_ANALYSIS: { maxRequests: 10, windowSeconds: 3600 },
  // Image upload: 20 per hour
  IMAGE_UPLOAD: { maxRequests: 20, windowSeconds: 3600 },
  // General API: 100 per minute
  GENERAL_API: { maxRequests: 100, windowSeconds: 60 },
  // Checkout: 5 per day
  CHECKOUT: { maxRequests: 5, windowSeconds: 86400 },
} as const;

/**
 * Checks if a user has exceeded their rate limit
 *
 * @param userId Firebase UID
 * @param endpoint Endpoint identifier (e.g., "chat_message", "ai_analysis")
 * @param config Rate limit configuration
 * @returns true if limit exceeded, false otherwise
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  const rateLimitDoc = db.collection("rate_limits").doc(userId);
  const countersDoc = await rateLimitDoc
    .collection("endpoints")
    .doc(endpoint)
    .get();

  if (!countersDoc.exists) {
    // First request - create counter
    await rateLimitDoc.collection("endpoints").doc(endpoint).set({
      count: 1,
      firstRequestTime: now,
      lastRequestTime: now,
    });
    return false;
  }

  const data = countersDoc.data();
  const firstRequestTime = data?.firstRequestTime || now;

  // Check if window has expired
  if (now - firstRequestTime > config.windowSeconds * 1000) {
    // Window expired - reset counter
    await rateLimitDoc.collection("endpoints").doc(endpoint).set({
      count: 1,
      firstRequestTime: now,
      lastRequestTime: now,
    });
    return false;
  }

  const currentCount = (data?.count || 0) + 1;

  // Update counter
  await rateLimitDoc.collection("endpoints").doc(endpoint).update({
    count: currentCount,
    lastRequestTime: now,
  });

  // Check if limit exceeded
  return currentCount > config.maxRequests;
}

/**
 * Enforces rate limit, throws error if exceeded
 *
 * @param userId Firebase UID
 * @param endpoint Endpoint identifier
 * @param config Rate limit configuration
 * @throws HttpsError if rate limit exceeded
 */
export async function enforceRateLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<void> {
  const exceeded = await checkRateLimit(userId, endpoint, config);

  if (exceeded) {
    throw new HttpsError(
      "resource-exhausted",
      `Rate limit exceeded for ${endpoint}. Maximum ${config.maxRequests} requests per ${config.windowSeconds} seconds.`
    );
  }
}

/**
 * Gets current usage for a user's endpoint
 */
export async function getCurrentUsage(
  userId: string,
  endpoint: string
): Promise<number> {
  const countersDoc = await db
    .collection("rate_limits")
    .doc(userId)
    .collection("endpoints")
    .doc(endpoint)
    .get();

  return countersDoc.data()?.count || 0;
}

/**
 * Resets rate limit counter for a user/endpoint (admin only)
 */
export async function resetRateLimit(
  userId: string,
  endpoint: string
): Promise<void> {
  await db
    .collection("rate_limits")
    .doc(userId)
    .collection("endpoints")
    .doc(endpoint)
    .delete();
}

/**
 * Resets all rate limits for a user (admin only)
 */
export async function resetAllRateLimits(userId: string): Promise<void> {
  const subcollection = await db
    .collection("rate_limits")
    .doc(userId)
    .collection("endpoints")
    .get();

  for (const doc of subcollection.docs) {
    await doc.ref.delete();
  }
}
