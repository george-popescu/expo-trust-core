/**
 * Type definitions for Expo Trust Core
 */

export interface Wallet {
  mnemonic: string;
  seed: string;
}

export interface Address {
  address: string;
  coinType: number;
  derivationPath?: string;
}

export interface SigningInput {
  // Base interface for signing inputs
  // Chain-specific inputs will extend this
  [key: string]: any;
}

export interface SigningOutput {
  signature: string;
  txHash?: string;
  encoded?: string;
}

export interface ChainInfo {
  name: string;
  symbol: string;
  coinType: number;
  decimals: number;
  derivationPath: string;
  iconUrl?: string; // URL to chain icon
}

export interface HDWalletOptions {
  mnemonic: string;
  passphrase?: string;
}

