import WalletCore from '../ExpoTrustCoreModule';
import type { SigningInput, SigningOutput } from '../types';

/**
 * Native transaction signing utilities
 * 
 * Sign transactions for multiple blockchains using native cryptography.
 * Private keys never leave native code - all signing happens in Swift/Kotlin.
 * 
 * Supported blockchains:
 * - Ethereum (Legacy + EIP-1559)
 * - Solana (SOL transfers)
 * - Bitcoin (SegWit)
 * - Dogecoin
 * 
 * @example
 * ```typescript
 * import { Transaction, CoinType } from 'expo-trust-core';
 * 
 * // Sign Ethereum EIP-1559 transaction
 * const signedTx = await Transaction.sign(
 *   mnemonic,
 *   CoinType.Ethereum,
 *   {
 *     to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
 *     value: '0x0de0b6b3a7640000', // 1 ETH in wei (hex)
 *     gasLimit: '0x5208', // 21000
 *     maxFeePerGas: '0x77359400', // 2 gwei
 *     maxPriorityFeePerGas: '0x59682f00', // 1.5 gwei
 *     nonce: 0,
 *     chainId: 1,
 *     data: '0x',
 *   },
 *   0
 * );
 * 
 * // Broadcast using ethers.js
 * await provider.broadcastTransaction(signedTx);
 * ```
 */
export class Transaction {
  /**
   * Sign a transaction for a specific blockchain
   * 
   * Uses Protocol Buffers internally to construct and sign transactions
   * in native code. Private keys never touch JavaScript.
   * 
   * @param mnemonic - BIP39 mnemonic phrase
   * @param coinType - Blockchain coin type (CoinType enum)
   * @param input - Transaction parameters (varies by blockchain)
   * @param accountIndex - HD account index (default: 0)
   * 
   * @returns Promise resolving to signed transaction:
   *   - Ethereum: 0x-prefixed RLP-encoded transaction
   *   - Solana: Base64-encoded transaction
   *   - Bitcoin: Hex-encoded raw transaction
   * 
   * @example
   * ```typescript
   * // Ethereum Legacy Transaction
   * const signedLegacy = await Transaction.sign(mnemonic, CoinType.Ethereum, {
   *   to: '0x...',
   *   value: '0x0de0b6b3a7640000',
   *   gasPrice: '0x04a817c800', // 20 gwei
   *   gasLimit: '0x5208',
   *   nonce: 0,
   *   chainId: 1,
   *   data: '0x',
   * });
   * 
   * // Solana SOL Transfer
   * const signedSol = await Transaction.sign(mnemonic, CoinType.Solana, {
   *   recentBlockhash: 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N',
   *   recipient: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
   *   amount: '1000000000', // 1 SOL in lamports
   * });
   * 
   * // Bitcoin UTXO Transaction
   * const signedBtc = await Transaction.sign(mnemonic, CoinType.Bitcoin, {
   *   utxos: [{
   *     txid: 'abc123...',
   *     vout: 0,
   *     value: 100000,
   *     scriptPubKey: '0014...',
   *   }],
   *   toAddress: 'bc1q...',
   *   amount: 50000,
   *   changeAddress: 'bc1q...',
   *   byteFee: 10,
   * });
   * ```
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
   * 
   * Same as sign() but returns a structured output with both
   * signature and encoded transaction.
   * 
   * @param mnemonic - BIP39 mnemonic phrase
   * @param coinType - Blockchain coin type
   * @param input - Transaction parameters
   * @param accountIndex - HD account index (default: 0)
   * 
   * @returns Promise resolving to SigningOutput with signature and encoded tx
   * 
   * @example
   * ```typescript
   * const result = await Transaction.buildAndSign(mnemonic, CoinType.Ethereum, txParams);
   * console.log(result.encoded); // Ready to broadcast
   * ```
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
   * Sign a raw transaction hash (advanced usage)
   * 
   * For custom transaction building workflows where you construct
   * the transaction externally and just need to sign the hash.
   * 
   * @param mnemonic - BIP39 mnemonic phrase
   * @param txHash - 32-byte transaction hash (hex string, with or without 0x)
   * @param coinType - Blockchain coin type
   * @param accountIndex - HD account index (default: 0)
   * 
   * @returns Signature as hex string (65 bytes for ECDSA)
   * 
   * @example
   * ```typescript
   * import { ethers } from 'ethers';
   * 
   * // 1. Build transaction externally
   * const unsignedTx = {
   *   to: '0x...',
   *   value: ethers.parseEther('1.0'),
   *   gasLimit: 21000,
   *   nonce: 0,
   *   chainId: 1,
   * };
   * 
   * // 2. Get transaction hash
   * const serialized = ethers.Transaction.from(unsignedTx).unsignedSerialized;
   * const txHash = ethers.keccak256(serialized);
   * 
   * // 3. Sign hash natively (private key never in JS!)
   * const signature = Transaction.signRawHash(mnemonic, txHash, CoinType.Ethereum, 0);
   * 
   * // 4. Attach signature and broadcast
   * const signedTx = ethers.Transaction.from({ ...unsignedTx, signature });
   * await provider.broadcastTransaction(signedTx.serialized);
   * ```
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
