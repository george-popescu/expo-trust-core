import WalletCore from '../ExpoTrustCoreModule';
import { CoinType } from './CoinType';

/**
 * Normalize message input for consistent signing
 * Handles both UTF-8 strings and hex-encoded bytes
 * @internal
 */
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
 * 
 * Sign messages for wallet authentication (Sign-In with Ethereum, etc.)
 * and dApp interactions. Supports both Ethereum (EIP-191) and Solana.
 * 
 * @example
 * ```typescript
 * import { Message, CoinType } from 'expo-trust-core';
 * 
 * // Sign message for dApp login
 * const signature = await Message.signEthereumMessage(
 *   mnemonic,
 *   "Sign in to OpenSea\n\nNonce: abc123",
 *   0
 * );
 * 
 * // Solana message signing
 * const solSig = await Message.signSolanaMessage(
 *   mnemonic,
 *   "Welcome to Magic Eden!",
 *   0
 * );
 * ```
 */
export class Message {
  /**
   * Sign a message using the appropriate method for the blockchain
   * 
   * - Ethereum: Uses EIP-191 personal_sign (prefixes message with 
   *   "\x19Ethereum Signed Message:\n{length}")
   * - Solana: Signs raw message bytes with Ed25519
   * 
   * @param mnemonic - BIP39 mnemonic phrase
   * @param message - Message to sign (UTF-8 string or 0x-prefixed hex)
   * @param coinType - Must be CoinType.Ethereum or CoinType.Solana
   * @param accountIndex - HD account index (default: 0)
   * 
   * @returns Promise resolving to signature as hex string (0x-prefixed for ETH)
   * 
   * @throws {Error} If coinType is not Ethereum or Solana
   * 
   * @example
   * ```typescript
   * const sig = await Message.sign(
   *   mnemonic,
   *   "Hello World",
   *   CoinType.Ethereum,
   *   0
   * );
   * // "0x1234...5678" (65 bytes: r + s + v)
   * ```
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
   * Sign an Ethereum message using EIP-191 personal_sign
   * 
   * Automatically prepends the Ethereum signed message prefix:
   * "\x19Ethereum Signed Message:\n{length}{message}"
   * 
   * Compatible with:
   * - MetaMask personal_sign
   * - WalletConnect personal_sign
   * - ethers.js signMessage
   * 
   * @param mnemonic - BIP39 mnemonic phrase
   * @param message - Message to sign (UTF-8 or hex string)
   * @param accountIndex - HD account index (default: 0)
   * 
   * @returns Promise resolving to 0x-prefixed signature (65 bytes)
   * 
   * @example
   * ```typescript
   * // Sign-In with Ethereum (SIWE)
   * const signature = await Message.signEthereumMessage(
   *   mnemonic,
   *   `opensea.io wants you to sign in with your Ethereum account:
   * 0x1234...5678
   * 
   * Click to sign in and accept the OpenSea Terms of Service.
   * 
   * URI: https://opensea.io
   * Nonce: 32891756
   * Issued At: 2024-01-01T00:00:00.000Z`,
   *   0
   * );
   * ```
   */
  static async signEthereumMessage(
    mnemonic: string,
    message: string,
    accountIndex: number = 0
  ): Promise<string> {
    return this.sign(mnemonic, message, CoinType.Ethereum, accountIndex);
  }

  /**
   * Sign a Solana message using Ed25519
   * 
   * Signs raw message bytes without any prefix.
   * Used for Solana dApp authentication.
   * 
   * @param mnemonic - BIP39 mnemonic phrase
   * @param message - Message to sign (UTF-8 string)
   * @param accountIndex - HD account index (default: 0)
   * 
   * @returns Promise resolving to signature as hex string (64 bytes)
   * 
   * @example
   * ```typescript
   * const signature = await Message.signSolanaMessage(
   *   mnemonic,
   *   "Welcome to Magic Eden!",
   *   0
   * );
   * ```
   */
  static async signSolanaMessage(
    mnemonic: string,
    message: string,
    accountIndex: number = 0
  ): Promise<string> {
    return this.sign(mnemonic, message, CoinType.Solana, accountIndex);
  }

  /**
   * Verify a signed message
   * 
   * @deprecated Not implemented - use on-chain verification instead
   * 
   * For Ethereum: Use ethers.verifyMessage() or ecrecover
   * For Solana: Use @solana/web3.js nacl.sign.detached.verify
   * 
   * @throws {Error} Always throws - not implemented
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
