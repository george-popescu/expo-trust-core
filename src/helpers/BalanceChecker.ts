/**
 * BalanceChecker - Helper for checking native coin balances
 * 
 * Users provide their own RPC URLs - SDK does not hardcode any endpoints
 */

import { ethers } from 'ethers';

export interface BalanceResult {
  balance: string; // Formatted balance (e.g., "1.234")
  balanceWei: string; // Raw balance in smallest unit
  decimals: number;
}

export class BalanceChecker {
  /**
   * Check EVM chain balance (Ethereum, Polygon, BSC, Arbitrum, etc.)
   * 
   * @param address - Wallet address to check
   * @param rpcUrl - User's RPC endpoint (e.g., Infura, Alchemy, custom)
   * @param decimals - Token decimals for formatting (default: 18 for ETH)
   * @returns Formatted balance and raw balance
   * 
   * @example
   * ```typescript
   * const myRpcUrl = 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY';
   * const result = await BalanceChecker.checkEVM(address, myRpcUrl, 18);
   * console.log(`Balance: ${result.balance} ETH`);
   * ```
   */
  static async checkEVM(
    address: string,
    rpcUrl: string,
    decimals: number = 18
  ): Promise<BalanceResult> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const balanceWei = await provider.getBalance(address);
      const balance = ethers.formatUnits(balanceWei, decimals);

      return {
        balance,
        balanceWei: balanceWei.toString(),
        decimals,
      };
    } catch (error) {
      throw new Error(
        `Failed to check balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check multiple addresses at once (batch)
   * 
   * @param addresses - Array of addresses to check
   * @param rpcUrl - User's RPC endpoint
   * @param decimals - Token decimals (default: 18)
   * @returns Array of balance results
   */
  static async checkMultipleEVM(
    addresses: string[],
    rpcUrl: string,
    decimals: number = 18
  ): Promise<BalanceResult[]> {
    const promises = addresses.map((address) =>
      this.checkEVM(address, rpcUrl, decimals)
    );
    return Promise.all(promises);
  }

  /**
   * Get current gas price from RPC
   * 
   * @param rpcUrl - User's RPC endpoint
   * @returns Gas price in Gwei
   */
  static async getGasPrice(rpcUrl: string): Promise<string> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const feeData = await provider.getFeeData();
      
      if (!feeData.gasPrice) {
        throw new Error('Gas price not available');
      }

      return ethers.formatUnits(feeData.gasPrice, 'gwei');
    } catch (error) {
      throw new Error(
        `Failed to get gas price: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get network chain ID
   * 
   * @param rpcUrl - User's RPC endpoint
   * @returns Chain ID (e.g., 1 for Ethereum mainnet)
   */
  static async getChainId(rpcUrl: string): Promise<number> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const network = await provider.getNetwork();
      return Number(network.chainId);
    } catch (error) {
      throw new Error(
        `Failed to get chain ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

