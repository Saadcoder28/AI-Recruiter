// This file contains configuration values that need to be accessible
// to API routes but aren't exposed to the client

// app/api/config.js
export const API_KEYS = {
  OPENROUTER: process.env.OPENROUTER_API_KEY ?? "",  // ← no hard‑coded string
};

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
