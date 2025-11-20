import { CoinType } from '../modules/CoinType';

/**
 * EVM Chain Configuration
 * All EVM chains use Ethereum (CoinType 60) addresses
 */

export interface EVMChainConfig {
  name: string;
  chainId: number;
  symbol: string;
  decimals: number;
  rpcUrl?: string;
  blockExplorer?: string;
}

/**
 * Default EVM chains (examples - users can add their own)
 */
export const DEFAULT_EVM_CHAINS: Record<string, EVMChainConfig> = {
  ETHEREUM: {
    name: 'Ethereum',
    chainId: 1,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
  },
  BSC: {
    name: 'BNB Smart Chain',
    chainId: 56,
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
  },
  POLYGON: {
    name: 'Polygon',
    chainId: 137,
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
  },
  BASE: {
    name: 'Base',
    chainId: 8453,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
  },
  ARBITRUM: {
    name: 'Arbitrum One',
    chainId: 42161,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
  },
  OPTIMISM: {
    name: 'Optimism',
    chainId: 10,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
  },
  AVALANCHE: {
    name: 'Avalanche C-Chain',
    chainId: 43114,
    symbol: 'AVAX',
    decimals: 18,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
  },
};

/**
 * Helper to create custom EVM chain config
 */
export function createEVMChain(config: EVMChainConfig): EVMChainConfig {
  return {
    ...config,
    decimals: config.decimals || 18,
  };
}

/**
 * Get EVM address (uses Ethereum CoinType)
 */
export function getEVMCoinType(): number {
  return CoinType.Ethereum;
}

/**
 * Check if a chain ID is EVM compatible
 */
export function isEVMChain(chainId: number): boolean {
  return Object.values(DEFAULT_EVM_CHAINS).some(chain => chain.chainId === chainId);
}

