/**
 * Solana Transaction Signer
 * Signs pre-built Solana transactions (from Jupiter, Raydium, etc.)
 * using exported private key from HD wallet
 */

import { Keypair, VersionedTransaction, Transaction } from '@solana/web3.js';
import { PrivateKey } from '../modules/PrivateKey';
import { CoinType } from '../modules/CoinType';

export interface SignSolanaTransactionInput {
  /**
   * Mnemonic phrase
   */
  mnemonic: string;
  
  /**
   * Serialized transaction from Jupiter/Raydium/etc (base64)
   */
  serializedTransaction: string;
  
  /**
   * Account index (default: 0)
   */
  accountIndex?: number;
  
  /**
   * Transaction type (default: 'versioned')
   * - 'versioned': VersionedTransaction (recommended, supports v0)
   * - 'legacy': Legacy Transaction
   */
  transactionType?: 'versioned' | 'legacy';
}

export interface SignedSolanaTransaction {
  /**
   * Base64 encoded signed transaction ready for broadcast
   */
  signedTransaction: string;
  
  /**
   * Transaction signature (first signature)
   */
  signature?: string;
}

/**
 * Solana Transaction Signer
 * 
 * This helper allows you to sign pre-built Solana transactions
 * (e.g., from Jupiter swap API, Raydium, Orca) without exposing
 * the mnemonic to external libraries.
 * 
 * @example
 * ```typescript
 * // 1. Get swap transaction from Jupiter
 * const { swapTransaction } = await jupiterApi.getSwap({...});
 * 
 * // 2. Sign with SDK
 * const { signedTransaction } = await SolanaTransactionSigner.sign({
 *   mnemonic,
 *   serializedTransaction: swapTransaction,
 *   accountIndex: 0,
 * });
 * 
 * // 3. Broadcast
 * const signature = await connection.sendRawTransaction(
 *   Buffer.from(signedTransaction, 'base64')
 * );
 * ```
 */
export class SolanaTransactionSigner {
  /**
   * Sign a pre-built Solana transaction
   * 
   * @param input Signing input parameters
   * @returns Signed transaction ready for broadcast
   */
  static async sign(input: SignSolanaTransactionInput): Promise<SignedSolanaTransaction> {
    const {
      mnemonic,
      serializedTransaction,
      accountIndex = 0,
      transactionType = 'versioned',
    } = input;

    try {
      // 1. Export private key from HD wallet
      const privateKeyHex = await PrivateKey.export(
        mnemonic,
        CoinType.Solana,
        accountIndex
      );

      // 2. Create Keypair for @solana/web3.js
      const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
      const keypair = Keypair.fromSecretKey(privateKeyBytes);

      // 3. Deserialize transaction based on type
      const txBuffer = Buffer.from(serializedTransaction, 'base64');
      
      if (transactionType === 'versioned') {
        // Versioned Transaction (supports v0 transactions)
        const transaction = VersionedTransaction.deserialize(txBuffer);
        
        // 4. Sign transaction
        transaction.sign([keypair]);
        
        // 5. Serialize and return
        const signedTxBuffer = transaction.serialize();
        const signedTxBase64 = Buffer.from(signedTxBuffer).toString('base64');
        
        return {
          signedTransaction: signedTxBase64,
          signature: transaction.signatures[0] ? Buffer.from(transaction.signatures[0]).toString('base64') : undefined,
        };
      } else {
        // Legacy Transaction
        const transaction = Transaction.from(txBuffer);
        
        // 4. Sign transaction
        transaction.sign(keypair);
        
        // 5. Serialize and return
        const signedTxBuffer = transaction.serialize();
        const signedTxBase64 = Buffer.from(signedTxBuffer).toString('base64');
        
        return {
          signedTransaction: signedTxBase64,
          signature: transaction.signature ? transaction.signature.toString('base64') : undefined,
        };
      }
    } catch (error) {
      throw new Error(
        `Failed to sign Solana transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sign multiple transactions in batch
   * 
   * @param mnemonic Mnemonic phrase
   * @param transactions Array of serialized transactions
   * @param accountIndex Account index (default: 0)
   * @param transactionType Transaction type (default: 'versioned')
   * @returns Array of signed transactions
   */
  static async signBatch(
    mnemonic: string,
    transactions: string[],
    accountIndex: number = 0,
    transactionType: 'versioned' | 'legacy' = 'versioned'
  ): Promise<SignedSolanaTransaction[]> {
    return Promise.all(
      transactions.map(tx =>
        this.sign({
          mnemonic,
          serializedTransaction: tx,
          accountIndex,
          transactionType,
        })
      )
    );
  }

  /**
   * Get public key for account without signing
   * 
   * @param mnemonic Mnemonic phrase
   * @param accountIndex Account index (default: 0)
   * @returns Public key (base58)
   */
  static async getPublicKey(mnemonic: string, accountIndex: number = 0): Promise<string> {
    const privateKeyHex = await PrivateKey.export(mnemonic, CoinType.Solana, accountIndex);
    const keypair = Keypair.fromSecretKey(Buffer.from(privateKeyHex, 'hex'));
    return keypair.publicKey.toBase58();
  }
}

