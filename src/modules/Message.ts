import WalletCore from '../ExpoTrustCoreModule';
import { CoinType } from './CoinType';

function normalizeMessageInput(message: string): string {
  if (typeof message !== 'string') {
    return message;
  }

  if (message.length === 0) {
    return '';
  }

  if (message.startsWith('0x') || message.startsWith('0X')) {
    let body = message.slice(2);
    if (body.length % 2 !== 0) {
      body = `0${body}`;
    }
    return `0x${body.toLowerCase()}`;
  }

  // Leave plain text untouched (including whitespace/newlines)
  return message;
}

/**
 * Message signing utilities for dApp authentication
 */
export class Message {
  /**
   * Sign a message (personal_sign for Ethereum, raw for Solana)
   * @param mnemonic - The wallet mnemonic
   * @param message - The message to sign
   * @param coinType - The coin type (Ethereum or Solana)
   * @param accountIndex - HD account index (default: 0)
   * @returns Signature as hex string
   */
  static async sign(
    mnemonic: string,
    message: string,
    coinType: CoinType,
    accountIndex: number = 0
  ): Promise<string> {
    if (coinType !== CoinType.Ethereum && coinType !== CoinType.Solana) {
      throw new Error('Message signing only supported for Ethereum and Solana');
    }

    const normalizedMessage = normalizeMessageInput(message);
    return WalletCore.signMessage(mnemonic, normalizedMessage, coinType, accountIndex);
  }

  /**
   * Sign an Ethereum message (personal_sign)
   * Prepends "\x19Ethereum Signed Message:\n" + message.length
   */
  static async signEthereumMessage(
    mnemonic: string,
    message: string,
    accountIndex: number = 0
  ): Promise<string> {
    return this.sign(mnemonic, message, CoinType.Ethereum, accountIndex);
  }

  /**
   * Sign a Solana message
   */
  static async signSolanaMessage(
    mnemonic: string,
    message: string,
    accountIndex: number = 0
  ): Promise<string> {
    return this.sign(mnemonic, message, CoinType.Solana, accountIndex);
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

