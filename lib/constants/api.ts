/**
 * API-related constants
 */

export const BASE_URL =
  globalThis.window?.location.origin ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  "http://localhost:3000";

