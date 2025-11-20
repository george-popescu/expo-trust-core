/**
 * React Hook for signing Solana transactions
 * Provides easy access to Solana transaction signing in React components
 */

import { useState, useCallback } from 'react';
import { SolanaTransactionSigner, SignSolanaTransactionInput, SignedSolanaTransaction } from '../helpers/SolanaTransactionSigner';

export interface UseSolanaTransactionSignReturn {
  /**
   * Sign a Solana transaction
   */
  signTransaction: (input: Omit<SignSolanaTransactionInput, 'mnemonic'>) => Promise<SignedSolanaTransaction>;
  
  /**
   * Sign multiple transactions in batch
   */
  signBatch: (transactions: string[], accountIndex?: number) => Promise<SignedSolanaTransaction[]>;
  
  /**
   * Get public key for account
   */
  getPublicKey: (accountIndex?: number) => Promise<string>;
  
  /**
   * Loading state
   */
  isLoading: boolean;
  
  /**
   * Error state
   */
  error: Error | null;
  
  /**
   * Last signed transaction
   */
  lastSignedTransaction: SignedSolanaTransaction | null;
}

/**
 * Hook for signing Solana transactions
 * 
 * @param mnemonic Mnemonic phrase (required)
 * @returns Transaction signing functions and state
 * 
 * @example
 * ```typescript
 * function SwapScreen() {
 *   const { wallet } = useWallet();
 *   const { signTransaction, isLoading, error } = useSolanaTransactionSign(wallet.mnemonic);
 *   
 *   const handleSwap = async () => {
 *     // 1. Get swap transaction from Jupiter
 *     const { swapTransaction } = await jupiterApi.getSwap({...});
 *     
 *     // 2. Sign with hook
 *     const { signedTransaction } = await signTransaction({
 *       serializedTransaction: swapTransaction,
 *       accountIndex: 0,
 *     });
 *     
 *     // 3. Broadcast
 *     const signature = await connection.sendRawTransaction(
 *       Buffer.from(signedTransaction, 'base64')
 *     );
 *     
 *     console.log('Swap completed!', signature);
 *   };
 *   
 *   return (
 *     <Button onPress={handleSwap} disabled={isLoading}>
 *       {isLoading ? 'Signing...' : 'Swap'}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useSolanaTransactionSign(mnemonic: string): UseSolanaTransactionSignReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSignedTransaction, setLastSignedTransaction] = useState<SignedSolanaTransaction | null>(null);

  const signTransaction = useCallback(
    async (input: Omit<SignSolanaTransactionInput, 'mnemonic'>): Promise<SignedSolanaTransaction> => {
      setIsLoading(true);
      setError(null);

      try {
        const signed = await SolanaTransactionSigner.sign({
          ...input,
          mnemonic,
        });

        setLastSignedTransaction(signed);
        return signed;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to sign transaction');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mnemonic]
  );

  const signBatch = useCallback(
    async (transactions: string[], accountIndex: number = 0): Promise<SignedSolanaTransaction[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const signed = await SolanaTransactionSigner.signBatch(
          mnemonic,
          transactions,
          accountIndex
        );

        if (signed.length > 0) {
          setLastSignedTransaction(signed[signed.length - 1]);
        }

        return signed;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to sign transactions');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mnemonic]
  );

  const getPublicKey = useCallback(
    async (accountIndex: number = 0): Promise<string> => {
      try {
        return await SolanaTransactionSigner.getPublicKey(mnemonic, accountIndex);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get public key');
        setError(error);
        throw error;
      }
    },
    [mnemonic]
  );

  return {
    signTransaction,
    signBatch,
    getPublicKey,
    isLoading,
    error,
    lastSignedTransaction,
  };
}

