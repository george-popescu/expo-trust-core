/**
 * Expo Trust Core
 * Multi-blockchain wallet functionality for React Native & Expo apps
 */

// Native module
export { default as WalletCore } from './src/ExpoTrustCoreModule';

// Core classes
export { HDWallet } from './src/modules/HDWallet';
export { Address } from './src/modules/Address';
export { Transaction } from './src/modules/Transaction';
export { Mnemonic } from './src/modules/Mnemonic';
export { Message } from './src/modules/Message';
export { TypedData } from './src/modules/TypedData';
export { PrivateKey } from './src/modules/PrivateKey';
export { PublicKey } from './src/modules/PublicKey';
export { SingleKeyWallet } from './src/modules/SingleKeyWallet';
export type { EIP712TypedData, EIP712Domain, EIP712TypeProperty } from './src/modules/TypedData';

// Enums and constants
export * from './src/modules/CoinType';
export { CHAINS, getChainInfo, getAllChains, getChainBySymbol, BNB_BEACON_CHAIN_COIN_TYPE } from './src/constants/chains';
export * from './src/constants/evmChains';

// Types (excluding Address to avoid conflict with Address class)
export type { 
  Wallet,
  SigningInput,
  SigningOutput,
  ChainInfo,
  HDWalletOptions
} from './src/types';

// Utils
export * from './src/utils/encoding';
export * from './src/utils/validation';
export * from './src/utils/errors';

// React hooks
export { useWallet } from './src/hooks/useWallet';
export { useAddress } from './src/hooks/useAddress';
export { useTransaction } from './src/hooks/useTransaction';
export { useMessageSign } from './src/hooks/useMessageSign';
export { useAccounts } from './src/hooks/useAccounts';
export type { AccountInfo } from './src/hooks/useAccounts';
export { useSolanaTransactionSign } from './src/hooks/useSolanaTransactionSign';

// P2 Blockchain Integration Helpers - EVM
export { BalanceChecker } from './src/helpers/BalanceChecker';
export type { BalanceResult } from './src/helpers/BalanceChecker';
export { TokenChecker } from './src/helpers/TokenChecker';
export type { TokenInfo, TokenAllowance } from './src/helpers/TokenChecker';
export { TransactionBuilder } from './src/helpers/TransactionBuilder';
export type { UnsignedTransaction, TransactionEstimate } from './src/helpers/TransactionBuilder';

// P2 Blockchain Integration Helpers - Solana
export { SolanaBalanceChecker } from './src/helpers/SolanaBalanceChecker';
export type { SolanaBalanceResult } from './src/helpers/SolanaBalanceChecker';
export { SolanaSPLChecker } from './src/helpers/SolanaSPLChecker';
export type { SPLTokenInfo, SPLTokenMetadata } from './src/helpers/SolanaSPLChecker';
export { SolanaTransactionBuilder } from './src/helpers/SolanaTransactionBuilder';
export type { UnsignedSolanaTransaction, SolanaTransactionEstimate } from './src/helpers/SolanaTransactionBuilder';

// P2 Blockchain Integration Helpers - Bitcoin
export { BitcoinBalanceChecker } from './src/helpers/BitcoinBalanceChecker';
export type { BitcoinBalanceResult, BitcoinUTXO, BitcoinAPIProvider } from './src/helpers/BitcoinBalanceChecker';
export { BitcoinTransactionBuilder } from './src/helpers/BitcoinTransactionBuilder';
export type { UnsignedBitcoinTransaction } from './src/helpers/BitcoinTransactionBuilder';

// P2 Blockchain Integration Helpers - Dogecoin
export { DogecoinBalanceChecker } from './src/helpers/DogecoinBalanceChecker';
export type { DogecoinBalanceResult, DogecoinUTXO, DogecoinAPIProvider } from './src/helpers/DogecoinBalanceChecker';
export { DogecoinTransactionBuilder } from './src/helpers/DogecoinTransactionBuilder';
export type { UnsignedDogecoinTransaction } from './src/helpers/DogecoinTransactionBuilder';

// Advanced Solana Transaction Signing
export { SolanaTransactionSigner } from './src/helpers/SolanaTransactionSigner';
export type { SignSolanaTransactionInput, SignedSolanaTransaction } from './src/helpers/SolanaTransactionSigner';
