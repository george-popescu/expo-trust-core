import WalletCore from '../ExpoTrustCoreModule';
import { CoinType } from './CoinType';

/**
 * EIP-712 Domain separator parameters
 * 
 * @see https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator
 */
export interface EIP712Domain {
  /** Human-readable name of the signing domain (e.g., "Uniswap") */
  name?: string;
  /** Version of the domain (e.g., "1") */
  version?: string;
  /** EIP-155 chain ID (e.g., 1 for Ethereum mainnet) */
  chainId?: number;
  /** Contract address that will verify the signature */
  verifyingContract?: string;
  /** Disambiguating salt for the protocol */
  salt?: string;
}

/**
 * Single type property definition for EIP-712
 */
export interface EIP712TypeProperty {
  /** Property name */
  name: string;
  /** Solidity type (e.g., "address", "uint256", "bytes32") */
  type: string;
}

/**
 * Complete EIP-712 typed data structure
 * 
 * @see https://eips.ethereum.org/EIPS/eip-712
 */
export interface EIP712TypedData {
  /** Type definitions including EIP712Domain */
  types: {
    EIP712Domain: EIP712TypeProperty[];
    [key: string]: EIP712TypeProperty[];
  };
  /** The primary type being signed */
  primaryType: string;
  /** Domain separator values */
  domain: EIP712Domain;
  /** The actual message data to sign */
  message: {
    [key: string]: any;
  };
}

/**
 * EIP-712 Typed Data Signing (Ethereum only)
 * 
 * Sign structured data for DeFi protocols, NFT marketplaces, and other
 * Ethereum applications. Used for gasless transactions (permits),
 * meta-transactions, and typed signatures.
 * 
 * @see https://eips.ethereum.org/EIPS/eip-712
 * 
 * @example
 * ```typescript
 * import { TypedData, CoinType } from 'expo-trust-core';
 * 
 * // Sign a Uniswap Permit2 approval
 * const typedData = {
 *   types: {
 *     EIP712Domain: [
 *       { name: 'name', type: 'string' },
 *       { name: 'chainId', type: 'uint256' },
 *       { name: 'verifyingContract', type: 'address' },
 *     ],
 *     PermitSingle: [
 *       { name: 'details', type: 'PermitDetails' },
 *       { name: 'spender', type: 'address' },
 *       { name: 'sigDeadline', type: 'uint256' },
 *     ],
 *     // ... more types
 *   },
 *   primaryType: 'PermitSingle',
 *   domain: {
 *     name: 'Permit2',
 *     chainId: 1,
 *     verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
 *   },
 *   message: { ... },
 * };
 * 
 * const signature = await TypedData.sign(mnemonic, typedData, 0);
 * ```
 */
export class TypedData {
  /**
   * Sign EIP-712 typed data
   * 
   * Produces a signature compatible with eth_signTypedData_v4 and
   * on-chain ECDSA.recover() verification.
   * 
   * @param mnemonic - BIP39 mnemonic phrase
   * @param typedData - EIP-712 structured data (object or JSON string)
   * @param accountIndex - HD account index (default: 0)
   * 
   * @returns Promise resolving to 0x-prefixed signature (65 bytes: r + s + v)
   * 
   * @example
   * ```typescript
   * // Sign ERC-20 Permit (gasless approval)
   * const permitData = TypedData.createPermit(
   *   ownerAddress,
   *   spenderAddress,
   *   "1000000000000000000", // 1 token in wei
   *   0, // nonce
   *   Math.floor(Date.now() / 1000) + 3600, // 1 hour deadline
   *   "USDC",
   *   "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
   *   1 // mainnet
   * );
   * 
   * const signature = await TypedData.sign(mnemonic, permitData, 0);
   * ```
   */
  static async sign(
    mnemonic: string,
    typedData: EIP712TypedData | string,
    accountIndex: number = 0
  ): Promise<string> {
    const typedDataString = typeof typedData === 'string' 
      ? typedData 
      : JSON.stringify(typedData);
    return WalletCore.signTypedData(mnemonic, typedDataString, CoinType.Ethereum, accountIndex);
  }

  /**
   * Create an ERC-2612 Permit structure for gasless token approvals
   * 
   * Useful for creating permit signatures that allow spending
   * tokens without a separate approval transaction.
   * 
   * @param owner - Token owner address
   * @param spender - Address being approved to spend tokens
   * @param value - Amount to approve (in smallest unit, e.g., wei)
   * @param nonce - Owner's current permit nonce (from contract)
   * @param deadline - Unix timestamp when permit expires
   * @param tokenName - ERC-20 token name (must match contract)
   * @param tokenAddress - ERC-20 token contract address
   * @param chainId - EIP-155 chain ID
   * 
   * @returns EIP-712 typed data structure ready for signing
   * 
   * @example
   * ```typescript
   * const permitData = TypedData.createPermit(
   *   "0x1234...owner",
   *   "0x5678...spender",
   *   "1000000", // 1 USDC (6 decimals)
   *   0,
   *   Math.floor(Date.now() / 1000) + 3600,
   *   "USD Coin",
   *   "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
   *   1
   * );
   * 
   * const signature = await TypedData.sign(mnemonic, permitData);
   * 
   * // Use signature in permit() call
   * await tokenContract.permit(
   *   owner, spender, value, deadline, v, r, s
   * );
   * ```
   */
  static createPermit(
    owner: string,
    spender: string,
    value: string,
    nonce: number,
    deadline: number,
    tokenName: string,
    tokenAddress: string,
    chainId: number
  ): EIP712TypedData {
    return {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      primaryType: 'Permit',
      domain: {
        name: tokenName,
        version: '1',
        chainId,
        verifyingContract: tokenAddress,
      },
      message: {
        owner,
        spender,
        value,
        nonce,
        deadline,
      },
    };
  }
}
