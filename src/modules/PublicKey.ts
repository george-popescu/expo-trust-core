import WalletCore from '../ExpoTrustCoreModule';
import { CoinType } from './CoinType';

/**
 * Public Key operations
 */
export class PublicKey {
  /**
   * Get public key for a specific coin and account
   * @param mnemonic - The wallet mnemonic
   * @param coinType - The coin type
   * @param accountIndex - Account index (default: 0)
   * @returns Public key as hex string (compressed format)
   */
  static async get(
    mnemonic: string,
    coinType: CoinType,
    accountIndex: number = 0
  ): Promise<string> {
    return await WalletCore.getPublicKey(mnemonic, coinType, accountIndex);
  }

  /**
   * Get multiple public keys for different accounts
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

