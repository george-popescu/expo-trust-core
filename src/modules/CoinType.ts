/**
 * Blockchain Coin Types based on SLIP-44
 * 
 * SLIP-44 defines a standard for cryptocurrency coin types used in
 * HD wallet derivation paths (BIP-44).
 * 
 * @see https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 * 
 * @example
 * ```typescript
 * import { CoinType, Address } from 'expo-trust-core';
 * 
 * // Generate Ethereum address
 * const ethAddr = await Address.generate(mnemonic, CoinType.Ethereum);
 * 
 * // Note: All EVM chains (Polygon, Arbitrum, etc.) use CoinType.Ethereum
 * // The address is the same across all EVM chains
 * ```
 */
export enum CoinType {
  /** Bitcoin (BTC) - Coin type 0 */
  Bitcoin = 0,
  
  /** Litecoin (LTC) - Coin type 2 */
  Litecoin = 2,
  
  /** Dogecoin (DOGE) - Coin type 3 */
  Dogecoin = 3,
  
  /** Dash (DASH) - Coin type 5 */
  Dash = 5,
  
  /** 
   * Ethereum (ETH) - Coin type 60
   * 
   * Also used for all EVM-compatible chains:
   * - Polygon (MATIC)
   * - Arbitrum (ARB)
   * - Optimism (OP)
   * - Base
   * - BSC (BNB)
   * - Avalanche C-Chain (AVAX)
   * 
   * Addresses are identical across all EVM chains.
   */
  Ethereum = 60,
  
  /** Ethereum Classic (ETC) - Coin type 61 */
  EthereumClassic = 61,
  
  /** Cosmos (ATOM) - Coin type 118 */
  Cosmos = 118,
  
  /** Ripple/XRP (XRP) - Coin type 144 */
  Ripple = 144,
  
  /** Bitcoin Cash (BCH) - Coin type 145 */
  BitcoinCash = 145,
  
  /** Stellar (XLM) - Coin type 148 */
  Stellar = 148,
  
  /** Tron (TRX) - Coin type 195 */
  Tron = 195,
  
  /** Polkadot (DOT) - Coin type 354 */
  Polkadot = 354,
  
  /** Solana (SOL) - Coin type 501 */
  Solana = 501,
  
  /** BNB Beacon Chain (BNB) - Coin type 714 */
  BinanceChain = 714,
}

/**
 * Priority chain types for wallet display
 * 
 * These are the most commonly used chains that should be
 * shown prominently in wallet UIs.
 */
export const PriorityChains = [
  CoinType.Bitcoin,
  CoinType.Ethereum,
  CoinType.Solana,
  CoinType.Dogecoin,
] as const;

/**
 * Get human-readable name for a coin type
 * 
 * @param coinType - CoinType enum value
 * @returns Human-readable blockchain name
 * 
 * @example
 * ```typescript
 * getCoinTypeName(CoinType.Ethereum); // "Ethereum"
 * getCoinTypeName(CoinType.Solana);   // "Solana"
 * getCoinTypeName(999);               // "Unknown (999)"
 * ```
 */
export function getCoinTypeName(coinType: CoinType): string {
  return CoinType[coinType] || `Unknown (${coinType})`;
}

/**
 * Check if a coin type is supported by this SDK
 * 
 * @param coinType - Numeric coin type to check
 * @returns true if coin type is in CoinType enum
 * 
 * @example
 * ```typescript
 * isCoinTypeSupported(60);  // true (Ethereum)
 * isCoinTypeSupported(999); // false
 * ```
 */
export function isCoinTypeSupported(coinType: number): boolean {
  return Object.values(CoinType).includes(coinType);
}
