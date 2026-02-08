import WalletCore from '../ExpoTrustCoreModule';

/**
 * BIP39 Mnemonic phrase utilities
 * 
 * Provides generation and validation of mnemonic seed phrases
 * used for HD wallet derivation.
 * 
 * @see https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
 * 
 * @example
 * ```typescript
 * // Generate a new 12-word mnemonic
 * const mnemonic = await Mnemonic.generate(128);
 * console.log(mnemonic); // "word1 word2 ... word12"
 * 
 * // Generate a 24-word mnemonic for extra security
 * const mnemonic24 = await Mnemonic.generate(256);
 * 
 * // Validate an existing mnemonic
 * const isValid = await Mnemonic.validate(mnemonic);
 * ```
 */
export class Mnemonic {
  /**
   * Generate a new BIP39 mnemonic phrase
   * 
   * @param strength - Entropy strength in bits. Determines word count:
   *   - 128 bits = 12 words (default, recommended for mobile)
   *   - 160 bits = 15 words
   *   - 192 bits = 18 words
   *   - 224 bits = 21 words
   *   - 256 bits = 24 words (maximum security)
   * 
   * @returns Promise resolving to space-separated mnemonic words
   * 
   * @throws {Error} If strength is not one of: 128, 160, 192, 224, 256
   * 
   * @example
   * ```typescript
   * // Standard 12-word mnemonic
   * const mnemonic = await Mnemonic.generate();
   * 
   * // High-security 24-word mnemonic
   * const mnemonic24 = await Mnemonic.generate(256);
   * ```
   */
  static async generate(strength: number = 128): Promise<string> {
    if (![128, 160, 192, 224, 256].includes(strength)) {
      throw new Error('Invalid mnemonic strength. Must be 128, 160, 192, 224, or 256');
    }
    return await WalletCore.generateMnemonic(strength);
  }

  /**
   * Validate a BIP39 mnemonic phrase
   * 
   * Checks that the mnemonic:
   * - Contains valid BIP39 wordlist words
   * - Has correct word count (12, 15, 18, 21, or 24)
   * - Has valid checksum
   * 
   * @param mnemonic - Space-separated mnemonic phrase to validate
   * 
   * @returns Promise resolving to true if valid, false otherwise
   * 
   * @example
   * ```typescript
   * const isValid = await Mnemonic.validate("abandon abandon ... about");
   * if (!isValid) {
   *   throw new Error("Invalid recovery phrase");
   * }
   * ```
   */
  static async validate(mnemonic: string): Promise<boolean> {
    return await WalletCore.validateMnemonic(mnemonic);
  }

  /**
   * Calculate word count from entropy strength
   * 
   * @param strength - Entropy in bits (128, 160, 192, 224, or 256)
   * @returns Number of words (12, 15, 18, 21, or 24)
   * 
   * @example
   * ```typescript
   * Mnemonic.getWordCount(128); // 12
   * Mnemonic.getWordCount(256); // 24
   * ```
   */
  static getWordCount(strength: number): number {
    return strength / 32 * 3;
  }

  /**
   * Calculate entropy strength from word count
   * 
   * @param wordCount - Number of words (12, 15, 18, 21, or 24)
   * @returns Entropy in bits (128, 160, 192, 224, or 256)
   * 
   * @example
   * ```typescript
   * Mnemonic.getStrength(12); // 128
   * Mnemonic.getStrength(24); // 256
   * ```
   */
  static getStrength(wordCount: number): number {
    return wordCount / 3 * 32;
  }
}
