/**
 * Encoding utilities for hex, base64, base58
 */

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert string to hex
 */
export function stringToHex(str: string): string {
  return bytesToHex(new TextEncoder().encode(str));
}

/**
 * Convert hex to string
 */
export function hexToString(hex: string): string {
  return new TextDecoder().decode(hexToBytes(hex));
}

/**
 * Base64 encode
 */
export function base64Encode(data: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(data);
  }
  return Buffer.from(data).toString('base64');
}

/**
 * Base64 decode
 */
export function base64Decode(data: string): string {
  if (typeof atob !== 'undefined') {
    return atob(data);
  }
  return Buffer.from(data, 'base64').toString();
}

/**
 * Check if string is valid hex
 */
export function isHex(str: string): boolean {
  return /^(0x)?[0-9a-fA-F]+$/.test(str) && str.length % 2 === 0;
}

