import WalletCore from '../ExpoTrustCoreModule';
import { CoinType } from './CoinType';

/**
 * EIP-712 Typed Data Signing (Ethereum only)
 * Used for structured data signing in DeFi (permits, meta-transactions, etc.)
 */

export interface EIP712Domain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: string;
}

export interface EIP712TypeProperty {
  name: string;
  type: string;
}

export interface EIP712TypedData {
  types: {
    EIP712Domain: EIP712TypeProperty[];
    [key: string]: EIP712TypeProperty[];
  };
  primaryType: string;
  domain: EIP712Domain;
  message: {
    [key: string]: any;
  };
}

export class TypedData {
  /**
   * Sign EIP-712 typed data (Ethereum only)
   * @param mnemonic - The wallet mnemonic
   * @param typedData - EIP-712 structured data
   * @returns Signature as hex string
   */
  static async sign(
    mnemonic: string,
    typedData: EIP712TypedData
  ): Promise<string> {
    const typedDataString = JSON.stringify(typedData);
    return WalletCore.signTypedData(mnemonic, typedDataString, CoinType.Ethereum);
  }

  /**
   * Create a simple EIP-712 permit structure (example)
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

