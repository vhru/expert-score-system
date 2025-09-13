import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.AES_SECRET_KEY || 'default_secret_key_32_chars_long';

export function encryptData(data: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decryptData(encryptedData: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

export function generateSecureId(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}
