import WalletCore from '../ExpoTrustCoreModule';
import type { SigningInput, SigningOutput } from '../types';

/**
 * Transaction signing utilities
 */
export class Transaction {
  /**
   * Sign a transaction for a specific blockchain
   * @param mnemonic - The wallet mnemonic
   * @param coinType - The blockchain coin type
   * @param input - Transaction signing input
   * @param accountIndex - HD account index (default: 0)
   * @returns Signed transaction as encoded string
   */
  static async sign(
    mnemonic: string,
    coinType: number,
    input: SigningInput,
    accountIndex: number = 0
  ): Promise<string> {
    // Convert object to JSON string for native module
    const inputString = typeof input === 'string' ? input : JSON.stringify(input);
    return await WalletCore.signTransaction(mnemonic, coinType, inputString, accountIndex);
  }

  /**
   * Build and sign a transaction (convenience method)
   * @param mnemonic - The wallet mnemonic
   * @param coinType - The blockchain coin type
   * @param input - Transaction signing input
   * @param accountIndex - HD account index (default: 0)
   * @returns Signing output with signature and encoded transaction
   */
  static async buildAndSign(
    mnemonic: string,
    coinType: number,
    input: SigningInput,
    accountIndex: number = 0
  ): Promise<SigningOutput> {
    const encoded = await this.sign(mnemonic, coinType, input, accountIndex);
    return {
      signature: encoded,
      encoded,
    };
  }

  /**
   * Sign a raw transaction hash
   * @param mnemonic - The wallet mnemonic  
   * @param txHash - Transaction hash to sign (hex string)
   * @param coinType - The blockchain coin type
   * @param accountIndex - HD account index (default: 0)
   * @returns Signature as hex string
   */
  static signRawHash(
    mnemonic: string,
    txHash: string,
    coinType: number,
    accountIndex: number = 0
  ): string {
    return WalletCore.signRawTransaction(mnemonic, txHash, coinType, accountIndex);
  }
}
