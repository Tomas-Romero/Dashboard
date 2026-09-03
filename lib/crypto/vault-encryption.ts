/**
 * Client-side (WebCrypto) encryption for the credentials vault.
 *
 * The Master Passphrase never leaves the browser and is never persisted.
 * Only ciphertext + iv + salt are sent to Supabase. A verifier hash (derived
 * with a *different* salt/info than the encryption key) lets us confirm the
 * passphrase is correct without ever storing the key itself.
 */

const PBKDF2_ITERATIONS = 250_000;
const AES_KEY_LENGTH = 256;

function toBase64(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function generateSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)));
}

async function importPassphraseKey(passphrase: string) {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey", "deriveBits"]
  );
}

export async function deriveKey(
  passphrase: string,
  saltB64: string
): Promise<CryptoKey> {
  const baseKey = await importPassphraseKey(passphrase);
  const salt = fromBase64(saltB64);

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Derives a verification hash from the passphrase, independent of the AES key. */
export async function deriveVerifier(
  passphrase: string,
  saltB64: string
): Promise<string> {
  const baseKey = await importPassphraseKey(passphrase);
  const salt = fromBase64(saltB64);

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    256
  );

  return toBase64(bits);
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
}

export async function encryptSecret(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: toBase64(ciphertextBuffer),
    iv: toBase64(iv),
  };
}

export async function decryptSecret(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const decoder = new TextDecoder();
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(payload.iv) },
    key,
    fromBase64(payload.ciphertext)
  );

  return decoder.decode(plaintextBuffer);
}
