import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const SALT_LENGTH = 16; // bytes
const KEY_LENGTH = 64; // bytes

function isString(value) {
  return typeof value === 'string' || value instanceof String;
}

export async function hashPassword(password) {
  if (!isString(password) || password.length === 0) {
    throw new Error('Password must be a non-empty string');
  }

  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${Buffer.from(derivedKey).toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  if (!isString(password) || !isString(storedHash) || storedHash.length === 0) {
    return false;
  }

  const [saltHex, keyHex] = storedHash.split(':');
  if (!saltHex || !keyHex) {
    return false;
  }

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const storedKey = Buffer.from(keyHex, 'hex');
    const derivedKey = await scrypt(password, salt, storedKey.length);
    return timingSafeEqual(storedKey, Buffer.from(derivedKey));
  } catch (error) {
    return false;
  }
}

export function isPasswordStrong(password) {
  if (!isString(password)) {
    return false;
  }

  if (password.length < 8) {
    return false;
  }

  const hasLetter = /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-zÀ-ÖØ-öø-ÿ0-9]/.test(password);

  return hasLetter && hasNumber && hasSpecial;
}
