import { useState, useCallback } from 'react';
import { Transaction } from '../modules/Transaction';
import type { SigningInput, SigningOutput } from '../types';

interface UseTransactionReturn {
  signedTransaction: string | null;
  isLoading: boolean;
  error: Error | null;
  signTransaction: (
    mnemonic: string,
    coinType: number,
    input: SigningInput
  ) => Promise<void>;
  buildAndSign: (
    mnemonic: string,
    coinType: number,
    input: SigningInput
  ) => Promise<SigningOutput | null>;
  reset: () => void;
}

/**
 * React hook for transaction signing
 */
export function useTransaction(): UseTransactionReturn {
  const [signedTransaction, setSignedTransaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signTransaction = useCallback(
    async (mnemonic: string, coinType: number, input: SigningInput) => {
      setIsLoading(true);
      setError(null);
      try {
        const signed = await Transaction.sign(mnemonic, coinType, input);
        setSignedTransaction(signed);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const buildAndSign = useCallback(
    async (
      mnemonic: string,
      coinType: number,
      input: SigningInput
    ): Promise<SigningOutput | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await Transaction.buildAndSign(mnemonic, coinType, input);
        setSignedTransaction(result.encoded || result.signature);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setSignedTransaction(null);
    setError(null);
  }, []);

  return {
    signedTransaction,
    isLoading,
    error,
    signTransaction,
    buildAndSign,
    reset,
  };
}

