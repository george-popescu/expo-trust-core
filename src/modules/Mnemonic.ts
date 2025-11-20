import WalletCore from '../ExpoTrustCoreModule';

/**
 * Mnemonic phrase utilities (BIP39)
 */
export class Mnemonic {
  /**
   * Generate a new mnemonic phrase
   * @param strength - Mnemonic strength in bits (128, 160, 192, 224, or 256)
   */
  static async generate(strength: number = 128): Promise<string> {
    if (![128, 160, 192, 224, 256].includes(strength)) {
      throw new Error('Invalid mnemonic strength. Must be 128, 160, 192, 224, or 256');
    }
    return await WalletCore.generateMnemonic(strength);
  }

  /**
   * Validate a mnemonic phrase
   */
  static async validate(mnemonic: string): Promise<boolean> {
    return await WalletCore.validateMnemonic(mnemonic);
  }

  /**
   * Get word count from strength
   */
  static getWordCount(strength: number): number {
    return strength / 32 * 3;
  }

  /**
   * Get strength from word count
   */
  static getStrength(wordCount: number): number {
    return wordCount / 3 * 32;
  }
}

