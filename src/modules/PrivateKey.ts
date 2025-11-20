import WalletCore from '../ExpoTrustCoreModule';
import { CoinType } from './CoinType';

/**
 * Private Key operations
 * SECURITY WARNING: Handle private keys with extreme care!
 * Never log, display, or transmit private keys without user consent.
 */
export class PrivateKey {
  /**
   * Export private key for a specific coin and account
   * @param mnemonic - The wallet mnemonic
   * @param coinType - The coin type
   * @param accountIndex - Account index (default: 0)
   * @returns Private key as hex string
   * 
   * WARNING: This exposes the private key. Use with caution!
   */
  static async export(
    mnemonic: string,
    coinType: CoinType,
    accountIndex: number = 0
  ): Promise<string> {
    return await WalletCore.getPrivateKey(mnemonic, coinType, accountIndex);
  }

  /**
   * Security wrapper - use this in UI to ensure warnings are shown
   */
  static async exportWithWarning(
    mnemonic: string,
    coinType: CoinType,
    accountIndex: number = 0,
    onWarningAccepted?: () => void
  ): Promise<string> {
    // Caller should show warning modal before calling this
    if (onWarningAccepted) {
      onWarningAccepted();
    }
    return this.export(mnemonic, coinType, accountIndex);
  }
}

