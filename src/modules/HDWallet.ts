import WalletCore from '../ExpoTrustCoreModule';
import type { HDWalletOptions, Wallet } from '../types';

/**
 * Hierarchical Deterministic (HD) Wallet
 * 
 * Manages a BIP39/BIP44 HD wallet that can derive unlimited addresses
 * across multiple blockchains from a single mnemonic phrase.
 * 
 * Features:
 * - Generate new wallet with fresh mnemonic
 * - Import existing wallet from mnemonic
 * - Derive addresses for any supported blockchain
 * - Support multiple accounts per chain
 * 
 * @see https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
 * 
 * @example
 * ```typescript
 * import { HDWallet, CoinType } from 'expo-trust-core';
 * 
 * // Create new wallet
 * const wallet = await HDWallet.create();
 * console.log(wallet.getMnemonic()); // "word1 word2 ... word12"
 * 
 * // Get addresses for multiple chains
 * const ethAddr = await wallet.getAddress(CoinType.Ethereum, 0);
 * const btcAddr = await wallet.getAddress(CoinType.Bitcoin, 0);
 * const solAddr = await wallet.getAddress(CoinType.Solana, 0);
 * ```
 */
export class HDWallet {
  private mnemonic: string;
  private passphrase: string;

  /**
   * @internal Use HDWallet.create() or HDWallet.fromMnemonic() instead
   */
  constructor(options: HDWalletOptions) {
    this.mnemonic = options.mnemonic;
    this.passphrase = options.passphrase || '';
  }

  /**
   * Create a new HD Wallet with freshly generated mnemonic
   * 
   * @param strength - Entropy strength in bits (default: 128 = 12 words)
   *   - 128 bits = 12 words (recommended for mobile)
   *   - 256 bits = 24 words (maximum security)
   * 
   * @returns Promise resolving to new HDWallet instance
   * 
   * @example
   * ```typescript
   * // Standard 12-word wallet
   * const wallet = await HDWallet.create();
   * 
   * // High-security 24-word wallet
   * const secureWallet = await HDWallet.create(256);
   * 
   * // Store mnemonic securely!
   * await SecureStore.setItemAsync('mnemonic', wallet.getMnemonic());
   * ```
   */
  static async create(strength: number = 128): Promise<HDWallet> {
    const mnemonic = await WalletCore.generateMnemonic(strength);
    return new HDWallet({ mnemonic });
  }

  /**
   * Import existing HD Wallet from mnemonic phrase
   * 
   * @param mnemonic - BIP39 mnemonic phrase (12 or 24 words)
   * @param passphrase - Optional BIP39 passphrase (advanced usage)
   * 
   * @returns Promise resolving to HDWallet instance
   * 
   * @throws {Error} If mnemonic is invalid
   * 
   * @example
   * ```typescript
   * // Import from backup
   * const mnemonic = await SecureStore.getItemAsync('mnemonic');
   * const wallet = await HDWallet.fromMnemonic(mnemonic);
   * 
   * // With optional passphrase (25th word)
   * const advancedWallet = await HDWallet.fromMnemonic(
   *   mnemonic,
   *   'my-secret-passphrase'
   * );
   * ```
   */
  static async fromMnemonic(
    mnemonic: string,
    passphrase?: string
  ): Promise<HDWallet> {
    const isValid = await WalletCore.validateMnemonic(mnemonic);
    if (!isValid) {
      throw new Error('Invalid mnemonic phrase');
    }
    return new HDWallet({ mnemonic, passphrase });
  }

  /**
   * Get the wallet's mnemonic phrase
   * 
   * ⚠️ **Security**: Handle with extreme care!
   * 
   * @returns The mnemonic phrase
   */
  getMnemonic(): string {
    return this.mnemonic;
  }

  /**
   * Get wallet info including seed
   * 
   * @returns Promise resolving to wallet info with mnemonic and seed
   */
  async getWalletInfo(): Promise<Wallet> {
    return await WalletCore.createWallet(this.mnemonic, this.passphrase);
  }

  /**
   * Get address for a specific blockchain and account
   * 
   * @param coinType - Blockchain coin type (use CoinType enum)
   * @param accountIndex - HD account index (default: 0)
   * 
   * @returns Promise resolving to blockchain address
   * 
   * @example
   * ```typescript
   * // First Ethereum address
   * const eth0 = await wallet.getAddress(CoinType.Ethereum, 0);
   * 
   * // Second Ethereum address
   * const eth1 = await wallet.getAddress(CoinType.Ethereum, 1);
   * 
   * // First Bitcoin address
   * const btc0 = await wallet.getAddress(CoinType.Bitcoin, 0);
   * ```
   */
  async getAddress(coinType: number, accountIndex: number = 0): Promise<string> {
    return await WalletCore.getAddress(this.mnemonic, coinType, accountIndex);
  }

  /**
   * Get addresses for multiple blockchains at once
   * 
   * @param coinTypes - Array of CoinType values
   * @param accountIndex - HD account index (default: 0)
   * 
   * @returns Promise resolving to array of addresses (same order as coinTypes)
   * 
   * @example
   * ```typescript
   * const [ethAddr, btcAddr, solAddr] = await wallet.getAddresses(
   *   [CoinType.Ethereum, CoinType.Bitcoin, CoinType.Solana],
   *   0
   * );
   * ```
   */
  async getAddresses(coinTypes: number[], accountIndex: number = 0): Promise<string[]> {
    return await WalletCore.getAddresses(this.mnemonic, coinTypes, accountIndex);
  }

  /**
   * Get multiple addresses for a single blockchain (different accounts)
   * 
   * Useful for displaying account selector UI.
   * 
   * @param coinType - Blockchain coin type
   * @param accountCount - Number of accounts to generate (default: 3)
   * 
   * @returns Promise resolving to array of addresses for accounts 0 to accountCount-1
   * 
   * @example
   * ```typescript
   * // Get first 5 Ethereum accounts
   * const accounts = await wallet.getAccountAddresses(CoinType.Ethereum, 5);
   * // ["0x1234...", "0x5678...", "0x9abc...", "0xdef0...", "0x1357..."]
   * ```
   */
  async getAccountAddresses(coinType: number, accountCount: number = 3): Promise<string[]> {
    const addresses: string[] = [];
    for (let i = 0; i < accountCount; i++) {
      const address = await this.getAddress(coinType, i);
      addresses.push(address);
    }
    return addresses;
  }

  /**
   * Sign a transaction using this wallet
   * 
   * @param coinType - Blockchain coin type
   * @param input - Transaction parameters (varies by blockchain)
   * @param accountIndex - HD account index (default: 0)
   * 
   * @returns Promise resolving to signed transaction
   * 
   * @example
   * ```typescript
   * const signedTx = await wallet.signTransaction(
   *   CoinType.Ethereum,
   *   {
   *     to: '0x...',
   *     value: '0x0de0b6b3a7640000',
   *     gasLimit: '0x5208',
   *     nonce: 0,
   *     chainId: 1,
   *   },
   *   0
   * );
   * ```
   */
  async signTransaction(coinType: number, input: any, accountIndex: number = 0): Promise<string> {
    const inputString = typeof input === 'string' ? input : JSON.stringify(input);
    return await WalletCore.signTransaction(this.mnemonic, coinType, inputString, accountIndex);
  }
}
