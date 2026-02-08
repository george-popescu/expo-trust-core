import WalletCore from '../ExpoTrustCoreModule';

/**
 * Blockchain address utilities
 * 
 * Generate and validate addresses for multiple blockchains from a single mnemonic.
 * Supports HD derivation with multiple account indices.
 * 
 * @example
 * ```typescript
 * import { Address, CoinType } from 'expo-trust-core';
 * 
 * // Generate Ethereum address
 * const ethAddress = await Address.generate(mnemonic, CoinType.Ethereum);
 * 
 * // Generate Bitcoin address (SegWit)
 * const btcAddress = await Address.generate(mnemonic, CoinType.Bitcoin);
 * 
 * // Generate multiple accounts
 * const account0 = await Address.generate(mnemonic, CoinType.Ethereum, 0);
 * const account1 = await Address.generate(mnemonic, CoinType.Ethereum, 1);
 * ```
 */
export class Address {
  /**
   * Generate a blockchain address from mnemonic
   * 
   * Uses BIP44/BIP84 derivation paths based on coin type:
   * - Ethereum: m/44'/60'/0'/0/{accountIndex}
   * - Bitcoin: m/84'/0'/0'/0/{accountIndex} (Native SegWit)
   * - Solana: m/44'/501'/{accountIndex}'/0'
   * - Dogecoin: m/44'/3'/0'/0/{accountIndex}
   * 
   * @param mnemonic - BIP39 mnemonic phrase (12 or 24 words)
   * @param coinType - Blockchain coin type (use CoinType enum)
   * @param accountIndex - HD account index for multiple addresses (default: 0)
   * 
   * @returns Promise resolving to the blockchain address string
   * 
   * @example
   * ```typescript
   * // First Ethereum address
   * const addr0 = await Address.generate(mnemonic, CoinType.Ethereum, 0);
   * // "0x1234...abcd"
   * 
   * // Second Ethereum address (same mnemonic)
   * const addr1 = await Address.generate(mnemonic, CoinType.Ethereum, 1);
   * // "0x5678...efgh"
   * ```
   */
  static async generate(
    mnemonic: string,
    coinType: number,
    accountIndex: number = 0
  ): Promise<string> {
    return await WalletCore.getAddress(mnemonic, coinType, accountIndex);
  }

  /**
   * Validate a blockchain address format
   * 
   * Checks address format validity for the specified blockchain.
   * Does NOT verify if address exists on-chain or has balance.
   * 
   * @param address - The address string to validate
   * @param coinType - Blockchain coin type to validate against
   * 
   * @returns Promise resolving to true if format is valid
   * 
   * @example
   * ```typescript
   * // Validate Ethereum address
   * const isValid = await Address.validate(
   *   "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
   *   CoinType.Ethereum
   * );
   * 
   * // Validate Bitcoin SegWit address
   * const isValidBtc = await Address.validate(
   *   "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
   *   CoinType.Bitcoin
   * );
   * ```
   */
  static async validate(
    address: string,
    coinType: number
  ): Promise<boolean> {
    return await WalletCore.validateAddress(address, coinType);
  }

  /**
   * Format address for display (truncated with ellipsis)
   * 
   * Useful for UI display where full address is too long.
   * 
   * @param address - Full address string
   * @param startChars - Characters to show at start (default: 6)
   * @param endChars - Characters to show at end (default: 4)
   * 
   * @returns Formatted address like "0x1234...abcd"
   * 
   * @example
   * ```typescript
   * Address.format("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
   * // "0x742d...f44e"
   * 
   * Address.format("0x742d35Cc6634C0532925a3b844Bc454e4438f44e", 10, 6);
   * // "0x742d35Cc...38f44e"
   * ```
   */
  static format(address: string, startChars: number = 6, endChars: number = 4): string {
    if (address.length <= startChars + endChars) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }
}
