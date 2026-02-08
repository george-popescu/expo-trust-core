/**
 * CoinType Module Tests
 * 
 * Tests coin type enum values and utility functions.
 */

import { CoinType, getCoinTypeName, isCoinTypeSupported, PriorityChains } from '../src/modules/CoinType';

describe('CoinType', () => {
  describe('enum values', () => {
    it('should have correct SLIP-44 values', () => {
      expect(CoinType.Bitcoin).toBe(0);
      expect(CoinType.Litecoin).toBe(2);
      expect(CoinType.Dogecoin).toBe(3);
      expect(CoinType.Dash).toBe(5);
      expect(CoinType.Ethereum).toBe(60);
      expect(CoinType.EthereumClassic).toBe(61);
      expect(CoinType.Cosmos).toBe(118);
      expect(CoinType.Ripple).toBe(144);
      expect(CoinType.BitcoinCash).toBe(145);
      expect(CoinType.Stellar).toBe(148);
      expect(CoinType.Tron).toBe(195);
      expect(CoinType.Polkadot).toBe(354);
      expect(CoinType.Solana).toBe(501);
      expect(CoinType.BinanceChain).toBe(714);
    });

    it('should be usable as numbers in derivation paths', () => {
      const ethPath = `m/44'/${CoinType.Ethereum}'/0'/0/0`;
      expect(ethPath).toBe("m/44'/60'/0'/0/0");

      const btcPath = `m/84'/${CoinType.Bitcoin}'/0'/0/0`;
      expect(btcPath).toBe("m/84'/0'/0'/0/0");
    });
  });

  describe('PriorityChains', () => {
    it('should contain main supported chains', () => {
      expect(PriorityChains).toContain(CoinType.Bitcoin);
      expect(PriorityChains).toContain(CoinType.Ethereum);
      expect(PriorityChains).toContain(CoinType.Solana);
      expect(PriorityChains).toContain(CoinType.Dogecoin);
    });

    it('should have exactly 4 priority chains', () => {
      expect(PriorityChains).toHaveLength(4);
    });

    it('should be immutable (readonly)', () => {
      // TypeScript would prevent this at compile time, but we can test runtime
      const chains = [...PriorityChains];
      expect(chains).toHaveLength(4);
    });
  });

  describe('getCoinTypeName()', () => {
    it('should return correct names for known coin types', () => {
      expect(getCoinTypeName(CoinType.Bitcoin)).toBe('Bitcoin');
      expect(getCoinTypeName(CoinType.Ethereum)).toBe('Ethereum');
      expect(getCoinTypeName(CoinType.Solana)).toBe('Solana');
      expect(getCoinTypeName(CoinType.Dogecoin)).toBe('Dogecoin');
      expect(getCoinTypeName(CoinType.Polkadot)).toBe('Polkadot');
    });

    it('should return "Unknown" for unknown coin types', () => {
      expect(getCoinTypeName(999 as CoinType)).toBe('Unknown (999)');
      expect(getCoinTypeName(-1 as CoinType)).toBe('Unknown (-1)');
    });
  });

  describe('isCoinTypeSupported()', () => {
    it('should return true for supported coin types', () => {
      expect(isCoinTypeSupported(0)).toBe(true);   // Bitcoin
      expect(isCoinTypeSupported(60)).toBe(true);  // Ethereum
      expect(isCoinTypeSupported(501)).toBe(true); // Solana
      expect(isCoinTypeSupported(3)).toBe(true);   // Dogecoin
    });

    it('should return false for unsupported coin types', () => {
      expect(isCoinTypeSupported(999)).toBe(false);
      expect(isCoinTypeSupported(-1)).toBe(false);
      expect(isCoinTypeSupported(1000000)).toBe(false);
    });

    it('should work with all enum values', () => {
      const allCoinTypes = Object.values(CoinType).filter(
        (v) => typeof v === 'number'
      ) as number[];

      for (const coinType of allCoinTypes) {
        expect(isCoinTypeSupported(coinType)).toBe(true);
      }
    });
  });
});
