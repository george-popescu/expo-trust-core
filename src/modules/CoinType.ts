/**
 * CoinType enum based on SLIP-44
 * https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 */

export enum CoinType {
  Bitcoin = 0,
  Litecoin = 2,
  Dogecoin = 3,
  Dash = 5,
  Ethereum = 60,
  EthereumClassic = 61,
  Cosmos = 118,
  Ripple = 144,
  BitcoinCash = 145,
  Stellar = 148,
  Tron = 195,
  Polkadot = 354,
  Solana = 501,
  BinanceChain = 714,
  // Note: EVM chains (Polygon, Avalanche, Arbitrum, Optimism, Base) 
  // all use Ethereum (60) for addresses
}

/**
 * Priority chain types (unique CoinTypes only)
 */
export const PriorityChains = [
  CoinType.Bitcoin,
  CoinType.Ethereum,
  CoinType.Solana,
  CoinType.Dogecoin,
] as const;

/**
 * Get coin type name
 */
export function getCoinTypeName(coinType: CoinType): string {
  return CoinType[coinType] || `Unknown (${coinType})`;
}

/**
 * Check if coin type is supported
 */
export function isCoinTypeSupported(coinType: number): boolean {
  return Object.values(CoinType).includes(coinType);
}

