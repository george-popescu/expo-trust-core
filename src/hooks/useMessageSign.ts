import { useState, useCallback } from 'react';
import { Message } from '../modules/Message';
import { CoinType } from '../modules/CoinType';

interface UseMessageSignReturn {
  signature: string | null;
  isLoading: boolean;
  error: Error | null;
  signMessage: (mnemonic: string, message: string, coinType: CoinType) => Promise<void>;
  reset: () => void;
}

/**
 * React hook for message signing
 */
export function useMessageSign(): UseMessageSignReturn {
  const [signature, setSignature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signMessage = useCallback(
    async (mnemonic: string, message: string, coinType: CoinType) => {
      setIsLoading(true);
      setError(null);
      setSignature(null);
      
      try {
        const sig = await Message.sign(mnemonic, message, coinType);
        setSignature(sig);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setSignature(null);
    setError(null);
  }, []);

  return {
    signature,
    isLoading,
    error,
    signMessage,
    reset,
  };
}

