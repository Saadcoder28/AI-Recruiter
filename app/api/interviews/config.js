// This file contains configuration values that need to be accessible
// to API routes but aren't exposed to the client

/*  app/api/config.js  */

/**
 * All runtime‑sensitive values must come from environment variables.
 * Nothing in this file should be committed as a real key.
 */
export const API_KEYS = {
  /** OpenRouter / Gemini */
  OPENROUTER: process.env.OPENROUTER_API_KEY || '',
};

/** Public‑facing site URL (used for Referer header, etc.) */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
