import { z } from 'zod';

/**
 * Shared Zod validation schemas for API request bodies.
 * Centralises input validation and provides type-safe parsing.
 */

// --- /api/analyze ---
export const analyzeSchema = z.object({
  dominant: z.enum(['red', 'blue', 'white', 'yellow']),
  secondary: z.enum(['red', 'blue', 'white', 'yellow']),
  scores: z.record(z.enum(['red', 'blue', 'white', 'yellow']), z.number()),
  percentages: z.record(z.enum(['red', 'blue', 'white', 'yellow']), z.number()),
  health: z.enum(['thriving', 'growing', 'at-risk']),
});

// --- /api/job-search ---
export const jobSearchSchema = z.object({
  dominant: z.enum(['red', 'blue', 'white', 'yellow']),
  secondary: z.enum(['red', 'blue', 'white', 'yellow']).optional(),
  interests: z.string().min(1, 'Interests is required').max(500, 'Interests too long (max 500 chars)'),
  location: z.string().max(200, 'Location too long (max 200 chars)').optional(),
});

// --- /api/cv-audit ---
export const cvAuditSchema = z.object({
  cvText: z.string().max(15000, 'CV text too long (max 15000 chars)').optional(),
  jobDescription: z.string().min(1, 'Job description is required').max(5000, 'Job description too long (max 5000 chars)'),
  uploadedDoc: z
    .object({
      name: z.string(),
      mimeType: z.string(),
      base64: z.string(),
    })
    .optional(),
});

// --- /api/premium/redeem ---
export const redeemCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50, 'Code too long'),
});

// --- /api/premium/request-code ---
export const requestCodeSchema = z.object({
  email: z.string().email('Invalid email').max(320, 'Email too long'),
  name: z.string().max(200, 'Name too long').optional(),
  note: z.string().max(500, 'Note too long').optional(),
  tier: z.enum(['starter5', 'pro20']).optional(),
});

// --- /api/admin/send-code ---
export const sendCodeSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  tier: z.enum(['starter5', 'pro20']),
});

/**
 * Helper to format Zod errors into a user-readable string.
 */
export function formatZodError(error: z.ZodError<unknown>): string {
  return error.issues.map((issue) => issue.message).join('; ');
}

