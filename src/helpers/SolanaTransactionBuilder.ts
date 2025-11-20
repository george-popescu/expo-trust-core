/**
 * SolanaTransactionBuilder - Helper for building unsigned Solana transactions
 * 
 * Users provide RPC URLs for recent blockhash fetching
 * Transactions are built but NOT signed - use SDK signing after
 */

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export interface UnsignedSolanaTransaction {
  from: string;
  to: string;
  amount: string; // In SOL or token units
  recentBlockhash: string;
  feePayer: string;
  type: 'transfer' | 'spl-transfer';
  mintAddress?: string; // For SPL transfers
  serialized: string; // Base64 encoded transaction
}

export interface SolanaTransactionEstimate {
  estimatedFee: string; // In SOL
  recentBlockhash: string;
}

export class SolanaTransactionBuilder {
  /**
   * Build unsigned SOL transfer transaction
   * 
   * @param from - Sender address
   * @param to - Recipient address
   * @param amount - Amount in SOL (e.g., "0.5")
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Unsigned transaction ready for signing
   * 
   * @example
   * ```typescript
   * const unsignedTx = await SolanaTransactionBuilder.buildSOLTransfer(
   *   myAddress,
   *   recipientAddress,
   *   '0.5', // 0.5 SOL
   *   myRpcUrl
   * );
   * 
   * // Sign with SDK (user implements)
   * const signature = await wallet.signTransaction(unsignedTx);
   * ```
   */
  static async buildSOLTransfer(
    from: string,
    to: string,
    amount: string,
    rpcUrl: string
  ): Promise<UnsignedSolanaTransaction> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const fromPublicKey = new PublicKey(from);
      const toPublicKey = new PublicKey(to);

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed');

      // Convert SOL to lamports
      const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

      // Build transaction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: fromPublicKey,
      });

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports,
        })
      );

      // Serialize without signatures
      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }).toString('base64');

      return {
        from,
        to,
        amount,
        recentBlockhash: blockhash,
        feePayer: from,
        type: 'transfer',
        serialized,
      };
    } catch (error) {
      throw new Error(
        `Failed to build SOL transfer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build unsigned SPL token transfer transaction
   * 
   * @param from - Sender address
   * @param to - Recipient address
   * @param mintAddress - SPL token mint address
   * @param amount - Amount in token units (e.g., "100" USDC)
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Unsigned transaction ready for signing
   * 
   * @example
   * ```typescript
   * const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
   * const unsignedTx = await SolanaTransactionBuilder.buildSPLTransfer(
   *   myAddress,
   *   recipientAddress,
   *   usdcMint,
   *   '100', // 100 USDC
   *   myRpcUrl
   * );
   * ```
   * 
   * Note: This requires both sender and recipient to have token accounts.
   * Use createTokenAccountInstruction if recipient doesn't have one.
   */
  static async buildSPLTransfer(
    from: string,
    to: string,
    mintAddress: string,
    amount: string,
    rpcUrl: string
  ): Promise<UnsignedSolanaTransaction> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const fromPublicKey = new PublicKey(from);
      const toPublicKey = new PublicKey(to);
      const mintPublicKey = new PublicKey(mintAddress);

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed');

      // Get token accounts
      const fromTokenAccounts = await connection.getParsedTokenAccountsByOwner(
        fromPublicKey,
        { mint: mintPublicKey }
      );

      const toTokenAccounts = await connection.getParsedTokenAccountsByOwner(
        toPublicKey,
        { mint: mintPublicKey }
      );

      if (fromTokenAccounts.value.length === 0) {
        throw new Error('Sender does not have a token account for this mint');
      }

      if (toTokenAccounts.value.length === 0) {
        throw new Error(
          'Recipient does not have a token account. Create one first using createSPLTokenAccount()'
        );
      }

      const fromTokenAccount = fromTokenAccounts.value[0].pubkey;
      const toTokenAccount = toTokenAccounts.value[0].pubkey;

      // Get token decimals
      const tokenInfo = fromTokenAccounts.value[0].account.data.parsed.info;
      const decimals = tokenInfo.tokenAmount.decimals;

      // Convert amount to smallest unit
      const rawAmount = Math.floor(parseFloat(amount) * 10 ** decimals);

      // Build transaction with Token Program instruction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: fromPublicKey,
      });

      // Manual Token Program transfer instruction
      // Program ID: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
      const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      
      // Instruction: Transfer (index 3)
      const dataLayout = Buffer.alloc(9);
      dataLayout.writeUInt8(3, 0); // Transfer instruction
      dataLayout.writeBigUInt64LE(BigInt(rawAmount), 1);

      transaction.add({
        keys: [
          { pubkey: fromTokenAccount, isSigner: false, isWritable: true },
          { pubkey: toTokenAccount, isSigner: false, isWritable: true },
          { pubkey: fromPublicKey, isSigner: true, isWritable: false },
        ],
        programId: TOKEN_PROGRAM_ID,
        data: dataLayout,
      });

      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }).toString('base64');

      return {
        from,
        to,
        amount,
        recentBlockhash: blockhash,
        feePayer: from,
        type: 'spl-transfer',
        mintAddress,
        serialized,
      };
    } catch (error) {
      throw new Error(
        `Failed to build SPL transfer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Estimate transaction cost
   * 
   * @param from - Sender address
   * @param to - Recipient address
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Estimated fee in SOL
   */
  static async estimateTransactionCost(
    from: string,
    to: string,
    rpcUrl: string
  ): Promise<SolanaTransactionEstimate> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const fromPublicKey = new PublicKey(from);
      const toPublicKey = new PublicKey(to);

      const { blockhash } = await connection.getLatestBlockhash('confirmed');

      // Create a dummy transaction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: fromPublicKey,
      });

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports: 1,
        })
      );

      // Get fee
      const fee = await connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );

      const estimatedFee = fee.value 
        ? (fee.value / LAMPORTS_PER_SOL).toString()
        : '0.000005'; // Default ~5000 lamports

      return {
        estimatedFee,
        recentBlockhash: blockhash,
      };
    } catch (error) {
      throw new Error(
        `Failed to estimate cost: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get recent blockhash (required for all Solana transactions)
   * 
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Recent blockhash string
   */
  static async getRecentBlockhash(rpcUrl: string): Promise<string> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      return blockhash;
    } catch (error) {
      throw new Error(
        `Failed to get recent blockhash: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a Solana transaction would succeed (simulation)
   * 
   * @param serializedTransaction - Base64 encoded transaction
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Simulation result
   */
  static async simulateTransaction(
    serializedTransaction: string,
    rpcUrl: string
  ): Promise<{ success: boolean; logs: string[] }> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'));

      const simulation = await connection.simulateTransaction(transaction);

      return {
        success: simulation.value.err === null,
        logs: simulation.value.logs || [],
      };
    } catch (error) {
      throw new Error(
        `Failed to simulate transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

