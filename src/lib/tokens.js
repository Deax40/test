import { webcrypto } from 'node:crypto';

const cryptoApi = globalThis.crypto ?? webcrypto;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const DEFAULT_SECRET = 'change-me-in-production';
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 heures
let cachedKeyPromise = null;

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || DEFAULT_SECRET;
  if (!secret || secret.length < 16) {
    return DEFAULT_SECRET;
  }
  return secret;
}

async function getSigningKey() {
  if (!cachedKeyPromise) {
    const secretBytes = textEncoder.encode(getSecret());
    cachedKeyPromise = cryptoApi.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  }
  return cachedKeyPromise;
}

function base64UrlEncodeBytes(bytes) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }
  let binary = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncodeString(binary);
}

function base64UrlEncodeString(str) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64url');
  }
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function base64UrlDecodeToBytes(str) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(str, 'base64url'));
  }
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function createSessionToken(payload, options = {}) {
  const ttl = typeof options.ttlSeconds === 'number' ? options.ttlSeconds : SESSION_DURATION_SECONDS;
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const completePayload = { ...payload, exp };
  const payloadJson = JSON.stringify(completePayload);
  const payloadBytes = textEncoder.encode(payloadJson);
  const payloadB64 = base64UrlEncodeBytes(payloadBytes);

  const key = await getSigningKey();
  const signatureBuffer = await cryptoApi.subtle.sign('HMAC', key, textEncoder.encode(payloadB64));
  const signatureB64 = base64UrlEncodeBytes(new Uint8Array(signatureBuffer));

  return `${payloadB64}.${signatureB64}`;
}

export async function verifySessionToken(token) {
  if (typeof token !== 'string' || token.length === 0) {
    return null;
  }
  const [payloadB64, signatureB64] = token.split('.');
  if (!payloadB64 || !signatureB64) {
    return null;
  }
  try {
    const key = await getSigningKey();
    const signatureBytes = base64UrlDecodeToBytes(signatureB64);
    const payloadEncodedBytes = textEncoder.encode(payloadB64);
    const isValid = await cryptoApi.subtle.verify('HMAC', key, signatureBytes, payloadEncodedBytes);
    if (!isValid) {
      return null;
    }

    const payloadBytes = base64UrlDecodeToBytes(payloadB64);
    const payloadJson = textDecoder.decode(payloadBytes);
    const payload = JSON.parse(payloadJson);
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

export const SESSION_COOKIE_NAME = 'app_session';
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_SECONDS;
