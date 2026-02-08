import WalletCore from '../ExpoTrustCoreModule';
import { CoinType } from './CoinType';

/**
 * Private Key export operations
 * 
 * ⚠️ **SECURITY WARNING**: Handle private keys with extreme care!
 * 
 * - Never log private keys to console
 * - Never transmit private keys over network
 * - Never store private keys in plain text
 * - Always show security warnings to users before export
 * - Consider using expo-secure-store for storage
 * 
 * @example
 * ```typescript
 * import { PrivateKey, CoinType } from 'expo-trust-core';
 * 
 * // Export with user warning
 * const privateKey = await PrivateKey.exportWithWarning(
 *   mnemonic,
 *   CoinType.Ethereum,
 *   0,
 *   () => {
 *     // User acknowledged the warning
 *     analytics.track('private_key_exported');
 *   }
 * );
 * ```
 */
export class PrivateKey {
  /**
   * Export private key for a specific blockchain and account
   * 
   * ⚠️ **WARNING**: This exposes the raw private key!
   * Use exportWithWarning() in production UI flows.
   * 
   * @param mnemonic - BIP39 mnemonic phrase
   * @param coinType - Blockchain coin type
   * @param accountIndex - HD account index (default: 0)
   * 
   * @returns Promise resolving to private key as hex string (no 0x prefix)
   *   - Ethereum/EVM: 32 bytes (64 hex chars)
   *   - Solana: 32 bytes (64 hex chars) 
   *   - Bitcoin: 32 bytes (64 hex chars)
   * 
   * @example
   * ```typescript
   * const ethPrivateKey = await PrivateKey.export(
   *   mnemonic,
   *   CoinType.Ethereum,
   *   0
   * );
   * // "a1b2c3d4..." (64 characters)
   * 
   * // Import into ethers.js
   * const wallet = new ethers.Wallet('0x' + ethPrivateKey);
   * ```
   */
  static async export(
    mnemonic: string,
    coinType: CoinType,
    accountIndex: number = 0
  ): Promise<string> {
    return await WalletCore.getPrivateKey(mnemonic, coinType, accountIndex);
  }

  /**
   * Export private key with security callback
   * 
   * Use this in production UI flows. The callback is invoked
   * after export, allowing you to track the security-sensitive action.
   * 
   * Recommended flow:
   * 1. Show warning modal explaining risks
   * 2. Require user confirmation (checkbox, PIN, biometric)
   * 3. Call this method with tracking callback
   * 4. Display key briefly, then clear from memory
   * 
   * @param mnemonic - BIP39 mnemonic phrase
   * @param coinType - Blockchain coin type
   * @param accountIndex - HD account index (default: 0)
   * @param onWarningAccepted - Callback invoked after export (for analytics/audit)
   * 
   * @returns Promise resolving to private key as hex string
   * 
   * @example
   * ```typescript
   * // In a React Native component
   * const handleExportKey = async () => {
   *   // 1. Show confirmation modal
   *   const confirmed = await showSecurityModal({
   *     title: "Export Private Key",
   *     message: "Anyone with this key can steal your funds...",
   *     confirmText: "I understand the risks",
   *   });
   *   
   *   if (!confirmed) return;
   *   
   *   // 2. Export with audit trail
   *   const key = await PrivateKey.exportWithWarning(
   *     mnemonic,
   *     CoinType.Ethereum,
   *     0,
   *     () => {
   *       analytics.track('private_key_exported', {
   *         coinType: 'ethereum',
   *         accountIndex: 0,
   *       });
   *     }
   *   );
   *   
   *   // 3. Show key briefly, then clear
   *   setDisplayedKey(key);
   *   setTimeout(() => setDisplayedKey(null), 60000);
   * };
   * ```
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
