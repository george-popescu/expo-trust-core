import WalletCore from '../ExpoTrustCoreModule';
import { CoinType } from './CoinType';

/**
 * Message signing utilities for dApp authentication
 */
export class Message {
  /**
   * Sign a message (personal_sign for Ethereum, raw for Solana)
   * @param mnemonic - The wallet mnemonic
   * @param message - The message to sign
   * @param coinType - The coin type (Ethereum or Solana)
   * @returns Signature as hex string
   */
  static async sign(
    mnemonic: string,
    message: string,
    coinType: CoinType
  ): Promise<string> {
    if (coinType !== CoinType.Ethereum && coinType !== CoinType.Solana) {
      throw new Error('Message signing only supported for Ethereum and Solana');
    }
    
    return WalletCore.signMessage(mnemonic, message, coinType);
  }

  /**
   * Sign an Ethereum message (personal_sign)
   * Prepends "\x19Ethereum Signed Message:\n" + message.length
   */
  static async signEthereumMessage(
    mnemonic: string,
    message: string
  ): Promise<string> {
    return this.sign(mnemonic, message, CoinType.Ethereum);
  }

  /**
   * Sign a Solana message
   */
  static async signSolanaMessage(
    mnemonic: string,
    message: string
  ): Promise<string> {
    return this.sign(mnemonic, message, CoinType.Solana);
  }

  /**
   * Verify a signed message (client-side verification)
   * Note: Requires public key recovery from signature
   * Currently not implemented - use blockchain/RPC verification instead
   */
  static async verify(
    message: string,
    signature: string,
    address: string,
    coinType: CoinType
  ): Promise<boolean> {
    throw new Error('Message verification not implemented. Use eth_call or Solana RPC for verification.');
  }
}

