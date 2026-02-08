import WalletCore from '../ExpoTrustCoreModule';
import { CoinType } from './CoinType';

/**
 * Single-key wallet imported from a private key
 * 
 * Unlike HD wallets derived from mnemonic, a SingleKeyWallet
 * is limited to one blockchain and cannot derive additional accounts.
 * 
 * Use cases:
 * - Importing existing wallet from private key export
 * - Using hardware-generated keys
 * - Single-purpose wallets
 * 
 * ⚠️ **Security Note**: The private key is held in memory.
 * Clear the wallet when done if security is critical.
 * 
 * @example
 * ```typescript
 * import { SingleKeyWallet, CoinType } from 'expo-trust-core';
 * 
 * // Import from MetaMask export
 * const wallet = await SingleKeyWallet.fromPrivateKey(
 *   'a1b2c3d4e5f6...', // 64 hex chars, no 0x prefix
 *   CoinType.Ethereum
 * );
 * 
 * console.log(wallet.getAddress()); // "0x..."
 * console.log(wallet.isLimited()); // true - cannot derive other chains
 * ```
 */
export class SingleKeyWallet {
  private privateKey: string;
  private coinType: CoinType;
  private address: string;
  private publicKey: string;

  /**
   * @internal Use SingleKeyWallet.fromPrivateKey() instead
   */
  private constructor(
    privateKey: string,
    coinType: CoinType,
    address: string,
    publicKey: string
  ) {
    this.privateKey = privateKey;
    this.coinType = coinType;
    this.address = address;
    this.publicKey = publicKey;
  }

  /**
   * Create wallet from private key
   * 
   * @param privateKey - Private key as hex string (64 chars, no 0x prefix)
   * @param coinType - Blockchain for this key
   * 
   * @returns Promise resolving to SingleKeyWallet instance
   * 
   * @throws {Error} If private key format is invalid
   * 
   * @example
   * ```typescript
   * // From Ethereum private key
   * const ethWallet = await SingleKeyWallet.fromPrivateKey(
   *   'a1b2c3d4e5f6...',
   *   CoinType.Ethereum
   * );
   * 
   * // From Solana private key (first 32 bytes of keypair)
   * const solWallet = await SingleKeyWallet.fromPrivateKey(
   *   'd4e5f6a1b2c3...',
   *   CoinType.Solana
   * );
   * ```
   */
  static async fromPrivateKey(
    privateKey: string,
    coinType: CoinType
  ): Promise<SingleKeyWallet> {
    const result = await WalletCore.importFromPrivateKey(privateKey, coinType);
    return new SingleKeyWallet(
      privateKey,
      coinType,
      result.address,
      result.publicKey
    );
  }

  /**
   * Get the wallet's blockchain address
   * 
   * @returns Address string in blockchain-native format
   * 
   * @example
   * ```typescript
   * wallet.getAddress();
   * // Ethereum: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
   * // Solana: "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK"
   * // Bitcoin: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
   * ```
   */
  getAddress(): string {
    return this.address;
  }

  /**
   * Get the wallet's public key
   * 
   * @returns Compressed public key as hex string
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Get the wallet's blockchain type
   * 
   * @returns CoinType enum value
   */
  getCoinType(): CoinType {
    return this.coinType;
  }

  /**
   * Check if wallet is limited to single chain
   * 
   * SingleKeyWallet always returns true.
   * Use HDWallet for multi-chain support.
   * 
   * @returns Always true for SingleKeyWallet
   */
  isLimited(): boolean {
    return true;
  }
}
