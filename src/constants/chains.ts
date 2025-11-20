import { CoinType } from '../modules/CoinType';
import type { ChainInfo } from '../types';

/**
 * Chain metadata for supported blockchains
 * 
 * Note: RPC URLs are NOT included here. Users provide their own RPC endpoints
 * when using blockchain integration helpers (BalanceChecker, TokenChecker, etc.)
 */

export const CHAINS: Record<string, ChainInfo> = {
  BITCOIN: {
    name: 'Bitcoin',
    symbol: 'BTC',
    coinType: CoinType.Bitcoin,
    decimals: 8,
    derivationPath: "m/84'/0'/0'/0/0",
    iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  },
  ETHEREUM: {
    name: 'Ethereum',
    symbol: 'ETH',
    coinType: CoinType.Ethereum,
    decimals: 18,
    derivationPath: "m/44'/60'/0'/0/0",
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  SOLANA: {
    name: 'Solana',
    symbol: 'SOL',
    coinType: CoinType.Solana,
    decimals: 9,
    derivationPath: "m/44'/501'/0'/0'",
    iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
  },
  DOGECOIN: {
    name: 'Dogecoin',
    symbol: 'DOGE',
    coinType: CoinType.Dogecoin,
    decimals: 8,
    derivationPath: "m/44'/3'/0'/0/0",
    iconUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
  },
};

/**
 * Note about BNB:
 * BNB Smart Chain (BSC) is an EVM chain and uses Ethereum addresses (CoinType 60).
 * If you need BNB Beacon Chain (native BNB), use CoinType 714 with wallet.getAddress(714).
 * See DEFAULT_EVM_CHAINS for BSC configuration.
 */
export const BNB_BEACON_CHAIN_COIN_TYPE = 714;

/**
 * Get chain info by coin type
 */
export function getChainInfo(coinType: number): ChainInfo | undefined {
  return Object.values(CHAINS).find((chain) => chain.coinType === coinType);
}

/**
 * Get all supported chains
 */
export function getAllChains(): ChainInfo[] {
  return Object.values(CHAINS);
}

/**
 * Get chain by symbol
 */
export function getChainBySymbol(symbol: string): ChainInfo | undefined {
  return Object.values(CHAINS).find(
    (chain) => chain.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

