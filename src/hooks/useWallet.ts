import { useState, useCallback } from 'react';
import { HDWallet } from '../modules/HDWallet';

interface UseWalletReturn {
  wallet: HDWallet | null;
  mnemonic: string | null;
  isLoading: boolean;
  error: Error | null;
  createWallet: (strength?: number) => Promise<void>;
  importWallet: (mnemonic: string, passphrase?: string) => Promise<void>;
  clearWallet: () => void;
}

/**
 * React hook for wallet management
 */
export function useWallet(): UseWalletReturn {
  const [wallet, setWallet] = useState<HDWallet | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createWallet = useCallback(async (strength: number = 128) => {
    setIsLoading(true);
    setError(null);
    try {
      const newWallet = await HDWallet.create(strength);
      setWallet(newWallet);
      setMnemonic(newWallet.getMnemonic());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importWallet = useCallback(
    async (mnemonicPhrase: string, passphrase?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const importedWallet = await HDWallet.fromMnemonic(mnemonicPhrase, passphrase);
        setWallet(importedWallet);
        setMnemonic(importedWallet.getMnemonic());
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearWallet = useCallback(() => {
    setWallet(null);
    setMnemonic(null);
    setError(null);
  }, []);

  return {
    wallet,
    mnemonic,
    isLoading,
    error,
    createWallet,
    importWallet,
    clearWallet,
  };
}

