/**
 * TokenChecker - Helper for checking ERC20 token balances
 * 
 * Users provide their own RPC URLs and token contracts
 */

import { ethers } from 'ethers';

/**
 * Standard ERC20 ABI for common token functions
 */
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

export interface TokenInfo {
  balance: string; // Formatted balance
  balanceRaw: string; // Raw balance (smallest unit)
  decimals: number;
  symbol: string;
  name: string;
  contractAddress: string;
}

export interface TokenAllowance {
  allowance: string; // Formatted allowance
  allowanceRaw: string; // Raw allowance
  owner: string;
  spender: string;
}

export class TokenChecker {
  /**
   * Check ERC20 token balance
   * 
   * @param walletAddress - Address to check balance for
   * @param tokenAddress - ERC20 token contract address
   * @param rpcUrl - User's RPC endpoint
   * @returns Token info including balance, symbol, decimals
   * 
   * @example
   * ```typescript
   * const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC on Ethereum
   * const myRpcUrl = 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY';
   * const token = await TokenChecker.checkERC20(walletAddress, usdcAddress, myRpcUrl);
   * console.log(`Balance: ${token.balance} ${token.symbol}`);
   * ```
   */
  static async checkERC20(
    walletAddress: string,
    tokenAddress: string,
    rpcUrl: string
  ): Promise<TokenInfo> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      // Fetch all token info in parallel
      const [balanceRaw, decimals, symbol, name] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals(),
        contract.symbol(),
        contract.name(),
      ]);

      const balance = ethers.formatUnits(balanceRaw, decimals);

      return {
        balance,
        balanceRaw: balanceRaw.toString(),
        decimals: Number(decimals),
        symbol,
        name,
        contractAddress: tokenAddress,
      };
    } catch (error) {
      throw new Error(
        `Failed to check token balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check multiple token balances for a wallet (batch)
   * 
   * @param walletAddress - Address to check balances for
   * @param tokenAddresses - Array of ERC20 token contract addresses
   * @param rpcUrl - User's RPC endpoint
   * @returns Array of token info
   */
  static async checkMultipleERC20(
    walletAddress: string,
    tokenAddresses: string[],
    rpcUrl: string
  ): Promise<TokenInfo[]> {
    const promises = tokenAddresses.map((tokenAddress) =>
      this.checkERC20(walletAddress, tokenAddress, rpcUrl)
    );
    return Promise.all(promises);
  }

  /**
   * Check token allowance for a spender
   * 
   * @param ownerAddress - Token owner address
   * @param spenderAddress - Spender address (e.g., DEX contract)
   * @param tokenAddress - ERC20 token contract address
   * @param rpcUrl - User's RPC endpoint
   * @returns Allowance info
   * 
   * @example
   * ```typescript
   * // Check how much USDC Uniswap can spend on your behalf
   * const allowance = await TokenChecker.checkAllowance(
   *   myAddress,
   *   uniswapRouterAddress,
   *   usdcAddress,
   *   rpcUrl
   * );
   * ```
   */
  static async checkAllowance(
    ownerAddress: string,
    spenderAddress: string,
    tokenAddress: string,
    rpcUrl: string
  ): Promise<TokenAllowance> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      const [allowanceRaw, decimals] = await Promise.all([
        contract.allowance(ownerAddress, spenderAddress),
        contract.decimals(),
      ]);

      const allowance = ethers.formatUnits(allowanceRaw, decimals);

      return {
        allowance,
        allowanceRaw: allowanceRaw.toString(),
        owner: ownerAddress,
        spender: spenderAddress,
      };
    } catch (error) {
      throw new Error(
        `Failed to check allowance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get total supply of a token
   * 
   * @param tokenAddress - ERC20 token contract address
   * @param rpcUrl - User's RPC endpoint
   * @returns Total supply (formatted)
   */
  static async getTotalSupply(
    tokenAddress: string,
    rpcUrl: string
  ): Promise<string> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      const [totalSupplyRaw, decimals] = await Promise.all([
        contract.totalSupply(),
        contract.decimals(),
      ]);

      return ethers.formatUnits(totalSupplyRaw, decimals);
    } catch (error) {
      throw new Error(
        `Failed to get total supply: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get token metadata only (no balance)
   * 
   * @param tokenAddress - ERC20 token contract address
   * @param rpcUrl - User's RPC endpoint
   * @returns Token metadata
   */
  static async getTokenMetadata(
    tokenAddress: string,
    rpcUrl: string
  ): Promise<Omit<TokenInfo, 'balance' | 'balanceRaw'>> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      const [decimals, symbol, name] = await Promise.all([
        contract.decimals(),
        contract.symbol(),
        contract.name(),
      ]);

      return {
        decimals: Number(decimals),
        symbol,
        name,
        contractAddress: tokenAddress,
      };
    } catch (error) {
      throw new Error(
        `Failed to get token metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

