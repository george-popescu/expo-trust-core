/**
 * SolanaBalanceChecker - Helper for checking native SOL balances
 * 
 * Users provide their own RPC URLs - SDK does not hardcode any endpoints
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface SolanaBalanceResult {
  balance: string; // Formatted balance in SOL (e.g., "1.234")
  balanceLamports: string; // Raw balance in lamports
  decimals: number; // Always 9 for SOL
}

export class SolanaBalanceChecker {
  /**
   * Check native SOL balance
   * 
   * @param address - Solana wallet address (base58 format)
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Formatted balance in SOL
   * 
   * @example
   * ```typescript
   * const myRpcUrl = 'https://api.mainnet-beta.solana.com';
   * const result = await SolanaBalanceChecker.checkSOL(address, myRpcUrl);
   * console.log(`Balance: ${result.balance} SOL`);
   * ```
   */
  static async checkSOL(
    address: string,
    rpcUrl: string
  ): Promise<SolanaBalanceResult> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const publicKey = new PublicKey(address);
      
      const balanceLamports = await connection.getBalance(publicKey);
      const balance = (balanceLamports / LAMPORTS_PER_SOL).toString();

      return {
        balance,
        balanceLamports: balanceLamports.toString(),
        decimals: 9, // SOL always has 9 decimals
      };
    } catch (error) {
      throw new Error(
        `Failed to check SOL balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check multiple Solana addresses at once (batch)
   * 
   * @param addresses - Array of Solana addresses
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Array of balance results
   */
  static async checkMultipleSOL(
    addresses: string[],
    rpcUrl: string
  ): Promise<SolanaBalanceResult[]> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const publicKeys = addresses.map(addr => new PublicKey(addr));
      
      // Batch request for efficiency
      const balances = await Promise.all(
        publicKeys.map(pk => connection.getBalance(pk))
      );

      return balances.map((balanceLamports) => ({
        balance: (balanceLamports / LAMPORTS_PER_SOL).toString(),
        balanceLamports: balanceLamports.toString(),
        decimals: 9,
      }));
    } catch (error) {
      throw new Error(
        `Failed to check multiple SOL balances: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current transaction fees (approximate)
   * 
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Recent transaction fee in SOL
   */
  static async getRecentFee(rpcUrl: string): Promise<string> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const recentFees = await connection.getRecentPrioritizationFees();
      
      if (recentFees.length === 0) {
        return '0.000005'; // Default ~5000 lamports
      }

      // Get median fee
      const sortedFees = recentFees
        .map(f => f.prioritizationFee)
        .sort((a, b) => a - b);
      const medianFee = sortedFees[Math.floor(sortedFees.length / 2)];
      
      // Add base fee (5000 lamports) + median priority fee
      const totalLamports = 5000 + medianFee;
      return (totalLamports / LAMPORTS_PER_SOL).toString();
    } catch (error) {
      throw new Error(
        `Failed to get recent fee: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get minimum balance for rent exemption (account creation)
   * 
   * @param rpcUrl - User's Solana RPC endpoint
   * @param dataLength - Size of account data in bytes (default: 0 for wallet)
   * @returns Minimum balance required in SOL
   */
  static async getMinimumBalanceForRentExemption(
    rpcUrl: string,
    dataLength: number = 0
  ): Promise<string> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const lamports = await connection.getMinimumBalanceForRentExemption(dataLength);
      
      return (lamports / LAMPORTS_PER_SOL).toString();
    } catch (error) {
      throw new Error(
        `Failed to get minimum balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if address is valid Solana address
   * 
   * @param address - Address to validate
   * @returns true if valid, false otherwise
   */
  static isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
}

