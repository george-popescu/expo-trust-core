import { useState, useCallback } from 'react';
import { HDWallet } from '../modules/HDWallet';
import { CoinType } from '../modules/CoinType';

export interface AccountInfo {
  index: number;
  address: string;
  coinType: number;
  derivationPath: string;
}

interface UseAccountsReturn {
  accounts: AccountInfo[];
  isLoading: boolean;
  error: Error | null;
  generateAccounts: (mnemonic: string, coinType: CoinType, count?: number) => Promise<void>;
  reset: () => void;
}

/**
 * React hook for managing multiple accounts from a single mnemonic
 */
export function useAccounts(): UseAccountsReturn {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateAccounts = useCallback(
    async (mnemonic: string, coinType: CoinType, count: number = 3) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const wallet = await HDWallet.fromMnemonic(mnemonic);
        const generatedAccounts: AccountInfo[] = [];
        
        for (let i = 0; i < count; i++) {
          const address = await wallet.getAddress(coinType, i);
          generatedAccounts.push({
            index: i,
            address,
            coinType,
            derivationPath: getDerivationPath(coinType, i),
          });
        }
        
        setAccounts(generatedAccounts);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setAccounts([]);
    setError(null);
  }, []);

  return {
    accounts,
    isLoading,
    error,
    generateAccounts,
    reset,
  };
}

/**
 * Get derivation path for a coin type and account index
 */
function getDerivationPath(coinType: CoinType, accountIndex: number): string {
  switch (coinType) {
    case CoinType.Bitcoin:
      return `m/84'/0'/${accountIndex}'/0/0`;
    case CoinType.Ethereum:
      return `m/44'/60'/${accountIndex}'/0/0`;
    case CoinType.Solana:
      return `m/44'/501'/${accountIndex}'/0'`;
    case CoinType.Dogecoin:
      return `m/44'/3'/${accountIndex}'/0/0`;
    default:
      return `m/44'/${coinType}/${accountIndex}'/0/0`;
  }
}

