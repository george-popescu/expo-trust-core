import WalletCore from '../ExpoTrustCoreModule';
import { CoinType } from './CoinType';

/**
 * Single-key wallet imported from private key
 * Limited to one blockchain - cannot derive other chains
 */
export class SingleKeyWallet {
  private privateKey: string;
  private coinType: CoinType;
  private address: string;
  private publicKey: string;

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
   * Import wallet from private key
   * @param privateKey - Private key as hex string
   * @param coinType - The coin type for this key
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
   * Get the wallet address
   */
  getAddress(): string {
    return this.address;
  }

  /**
   * Get the public key
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Get the coin type
   */
  getCoinType(): CoinType {
    return this.coinType;
  }

  /**
   * Check if this wallet is limited (single-chain)
   */
  isLimited(): boolean {
    return true; // Always true for SingleKeyWallet
  }
}

