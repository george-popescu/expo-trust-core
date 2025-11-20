import WalletCore from '../ExpoTrustCoreModule';
import type { HDWalletOptions, Wallet } from '../types';

/**
 * HDWallet class for managing hierarchical deterministic wallets
 */
export class HDWallet {
  private mnemonic: string;
  private passphrase: string;

  constructor(options: HDWalletOptions) {
    this.mnemonic = options.mnemonic;
    this.passphrase = options.passphrase || '';
  }

  /**
   * Create a new HD Wallet with generated mnemonic
   */
  static async create(strength: number = 128): Promise<HDWallet> {
    const mnemonic = await WalletCore.generateMnemonic(strength);
    return new HDWallet({ mnemonic });
  }

  /**
   * Import an existing HD Wallet from mnemonic
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
   */
  getMnemonic(): string {
    return this.mnemonic;
  }

  /**
   * Get wallet info including seed
   */
  async getWalletInfo(): Promise<Wallet> {
    return await WalletCore.createWallet(this.mnemonic, this.passphrase);
  }

  /**
   * Get address for a specific coin type
   * @param coinType - The coin type number
   * @param accountIndex - Optional account index (default: 0)
   */
  async getAddress(coinType: number, accountIndex: number = 0): Promise<string> {
    return await WalletCore.getAddress(this.mnemonic, coinType, accountIndex);
  }

  /**
   * Get addresses for multiple coin types
   */
  async getAddresses(coinTypes: number[], accountIndex: number = 0): Promise<string[]> {
    return await WalletCore.getAddresses(this.mnemonic, coinTypes, accountIndex);
  }

  /**
   * Get multiple addresses for a single coin type (different accounts)
   * @param coinType - The coin type
   * @param accountCount - Number of accounts to generate (default: 3)
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
   * Sign a transaction
   */
  async signTransaction(coinType: number, input: any): Promise<string> {
    // Convert object to JSON string for native module
    const inputString = typeof input === 'string' ? input : JSON.stringify(input);
    return await WalletCore.signTransaction(this.mnemonic, coinType, inputString);
  }
}

