import WalletCore from '../ExpoTrustCoreModule';

/**
 * Validation utilities
 */

/**
 * Validate mnemonic phrase
 */
export async function validateMnemonic(mnemonic: string): Promise<boolean> {
  if (!mnemonic || typeof mnemonic !== 'string') {
    return false;
  }
  
  const words = mnemonic.trim().split(/\s+/);
  if (![12, 15, 18, 21, 24].includes(words.length)) {
    return false;
  }

  return await WalletCore.validateMnemonic(mnemonic);
}

/**
 * Validate address for specific coin type
 */
export async function validateAddress(
  address: string,
  coinType: number
): Promise<boolean> {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  return await WalletCore.validateAddress(address, coinType);
}

/**
 * Check if mnemonic has correct word count
 */
export function hasValidWordCount(mnemonic: string): boolean {
  const words = mnemonic.trim().split(/\s+/);
  return [12, 15, 18, 21, 24].includes(words.length);
}

/**
 * Sanitize mnemonic (trim, lowercase, single spaces)
 */
export function sanitizeMnemonic(mnemonic: string): string {
  return mnemonic
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

