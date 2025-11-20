import { useState, useCallback } from 'react';
import { Address } from '../modules/Address';

interface UseAddressReturn {
  address: string | null;
  addresses: Record<number, string>;
  isLoading: boolean;
  error: Error | null;
  generateAddress: (mnemonic: string, coinType: number, accountIndex?: number) => Promise<void>;
  generateAddresses: (mnemonic: string, coinTypes: number[], accountIndex?: number) => Promise<void>;
  validateAddress: (address: string, coinType: number) => Promise<boolean>;
}

/**
 * React hook for address generation and management
 */
export function useAddress(): UseAddressReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateAddress = useCallback(
    async (mnemonic: string, coinType: number, accountIndex: number = 0) => {
      setIsLoading(true);
      setError(null);
      try {
        const addr = await Address.generate(mnemonic, coinType, accountIndex);
        setAddress(addr);
        setAddresses((prev) => ({ ...prev, [coinType]: addr }));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const generateAddresses = useCallback(
    async (mnemonic: string, coinTypes: number[], accountIndex: number = 0) => {
      setIsLoading(true);
      setError(null);
      try {
        const addressPromises = coinTypes.map((coinType) =>
          Address.generate(mnemonic, coinType, accountIndex)
        );
        const generatedAddresses = await Promise.all(addressPromises);
        
        const addressMap: Record<number, string> = {};
        coinTypes.forEach((coinType, index) => {
          addressMap[coinType] = generatedAddresses[index];
        });
        
        setAddresses(addressMap);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const validateAddress = useCallback(
    async (addr: string, coinType: number): Promise<boolean> => {
      try {
        return await Address.validate(addr, coinType);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      }
    },
    []
  );

  return {
    address,
    addresses,
    isLoading,
    error,
    generateAddress,
    generateAddresses,
    validateAddress,
  };
}

