import WalletCore from '../ExpoTrustCoreModule';
import type { SigningInput, SigningOutput } from '../types';

/**
 * Transaction signing utilities
 */
export class Transaction {
  /**
   * Sign a transaction for a specific blockchain
   */
  static async sign(
    mnemonic: string,
    coinType: number,
    input: SigningInput
  ): Promise<string> {
    // Convert object to JSON string for native module
    const inputString = typeof input === 'string' ? input : JSON.stringify(input);
    return await WalletCore.signTransaction(mnemonic, coinType, inputString);
  }

  /**
   * Build and sign a transaction (convenience method)
   */
  static async buildAndSign(
    mnemonic: string,
    coinType: number,
    input: SigningInput
  ): Promise<SigningOutput> {
    const encoded = await this.sign(mnemonic, coinType, input);
    return {
      signature: encoded,
      encoded,
    };
  }
}

