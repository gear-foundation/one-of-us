export const AUTH_STORAGE_KEY = "varauth_auth";

/** Varauth verifier program id (proxy to submit tx). */
export const VARAUTH_PROGRAM_ID = "0xcb72581cbec72ece141fec7422e83b68f9e551df";
// "0x0000000000000000000000000000000000000000000000000000000000000000";
export const AUTH_PROVIDER_URL =
  import.meta.env.VITE_AUTH_PROVIDER_URL ||
  "https://passkey.mithriy.com/" ||
  "http://localhost:5173/passkey/start";
