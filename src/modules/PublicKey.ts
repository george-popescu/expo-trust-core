import WalletCore from '../ExpoTrustCoreModule';
import { CoinType } from './CoinType';

/**
 * Public Key export operations
 * 
 * Export public keys for address verification, multisig setups,
 * and other scenarios requiring public key access.
 * 
 * Unlike private keys, public keys are safe to share.
 * 
 * @example
 * ```typescript
 * import { PublicKey, CoinType } from 'expo-trust-core';
 * 
 * // Get public key for verification
 * const pubKey = await PublicKey.get(mnemonic, CoinType.Ethereum, 0);
 * 
 * // Verify signature externally
 * const isValid = ethers.verifyMessage(message, signature) === address;
 * ```
 */
export class PublicKey {
  /**
   * Get public key for a specific blockchain and account
   * 
   * Returns the compressed public key in hex format.
   * 
   * @param mnemonic - BIP39 mnemonic phrase
   * @param coinType - Blockchain coin type
   * @param accountIndex - HD account index (default: 0)
   * 
   * @returns Promise resolving to public key as hex string:
   *   - Ethereum/EVM: 33 bytes compressed secp256k1 (66 hex chars)
   *   - Solana: 32 bytes Ed25519 (64 hex chars)
   *   - Bitcoin: 33 bytes compressed secp256k1 (66 hex chars)
   * 
   * @example
   * ```typescript
   * const ethPubKey = await PublicKey.get(mnemonic, CoinType.Ethereum, 0);
   * // "02a1b2c3d4..." (66 characters, compressed)
   * 
   * const solPubKey = await PublicKey.get(mnemonic, CoinType.Solana, 0);
   * // "a1b2c3d4..." (64 characters, Ed25519)
   * ```
   */
  static async get(
    mnemonic: string,
    coinType: CoinType,
    accountIndex: number = 0
  ): Promise<string> {
    return await WalletCore.getPublicKey(mnemonic, coinType, accountIndex);
  }

  /**
   * Get public keys for multiple accounts
   * 
   * Useful for displaying account list with public keys.
   * 
   * @param mnemonic - BIP39 mnemonic phrase
   * @param coinType - Blockchain coin type
   * @param accountCount - Number of accounts to generate (default: 3)
   * 
   * @returns Promise resolving to array of public key hex strings
   * 
   * @example
   * ```typescript
   * const pubKeys = await PublicKey.getMultiple(mnemonic, CoinType.Ethereum, 5);
   * // ["02abc...", "02def...", "02ghi...", "02jkl...", "02mno..."]
   * ```
   */
  static async getMultiple(
    mnemonic: string,
    coinType: CoinType,
    accountCount: number = 3
  ): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < accountCount; i++) {
      const key = await this.get(mnemonic, coinType, i);
      keys.push(key);
    }
    return keys;
  }
}
