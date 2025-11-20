/**
 * SolanaSPLChecker - Helper for checking SPL token balances
 * 
 * SPL = Solana Program Library (Solana's token standard, like ERC20)
 * Users provide their own RPC URLs and token mint addresses
 */

import { Connection, PublicKey } from '@solana/web3.js';

export interface SPLTokenInfo {
  balance: string; // Formatted balance
  balanceRaw: string; // Raw balance (smallest unit)
  decimals: number;
  mintAddress: string; // Token contract address (mint)
  tokenAccountAddress?: string; // User's token account for this mint
}

export interface SPLTokenMetadata {
  mintAddress: string;
  decimals: number;
  supply?: string; // Total supply if available
}

export class SolanaSPLChecker {
  /**
   * Check SPL token balance
   * 
   * @param walletAddress - User's Solana wallet address
   * @param mintAddress - SPL token mint address (contract)
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Token info including balance, decimals
   * 
   * @example
   * ```typescript
   * const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC on Solana
   * const myRpcUrl = 'https://api.mainnet-beta.solana.com';
   * const token = await SolanaSPLChecker.checkSPL(walletAddress, usdcMint, myRpcUrl);
   * console.log(`Balance: ${token.balance} USDC`);
   * ```
   */
  static async checkSPL(
    walletAddress: string,
    mintAddress: string,
    rpcUrl: string
  ): Promise<SPLTokenInfo> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(mintAddress);

      // Get token accounts owned by wallet for this mint
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        { mint: mintPublicKey }
      );

      if (tokenAccounts.value.length === 0) {
        // No token account = zero balance
        const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
        const decimals = mintInfo.value?.data && 'parsed' in mintInfo.value.data
          ? (mintInfo.value.data.parsed.info.decimals as number)
          : 9;

        return {
          balance: '0',
          balanceRaw: '0',
          decimals,
          mintAddress,
        };
      }

      // Get the first token account (usually only one per mint)
      const tokenAccount = tokenAccounts.value[0];
      const accountInfo = tokenAccount.account.data.parsed.info;
      
      const balanceRaw = accountInfo.tokenAmount.amount;
      const balance = accountInfo.tokenAmount.uiAmountString || '0';
      const decimals = accountInfo.tokenAmount.decimals;

      return {
        balance,
        balanceRaw,
        decimals,
        mintAddress,
        tokenAccountAddress: tokenAccount.pubkey.toBase58(),
      };
    } catch (error) {
      throw new Error(
        `Failed to check SPL token balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check multiple SPL token balances for a wallet (batch)
   * 
   * @param walletAddress - User's Solana wallet address
   * @param mintAddresses - Array of SPL token mint addresses
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Array of token info
   */
  static async checkMultipleSPL(
    walletAddress: string,
    mintAddresses: string[],
    rpcUrl: string
  ): Promise<SPLTokenInfo[]> {
    const promises = mintAddresses.map((mintAddress) =>
      this.checkSPL(walletAddress, mintAddress, rpcUrl)
    );
    return Promise.all(promises);
  }

  /**
   * Get all SPL token accounts owned by a wallet
   * 
   * @param walletAddress - User's Solana wallet address
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Array of all token accounts with balances
   * 
   * @example
   * ```typescript
   * // Get all tokens in wallet
   * const tokens = await SolanaSPLChecker.getAllTokens(myAddress, rpcUrl);
   * tokens.forEach(token => {
   *   console.log(`${token.balance} tokens (mint: ${token.mintAddress})`);
   * });
   * ```
   */
  static async getAllTokens(
    walletAddress: string,
    rpcUrl: string
  ): Promise<SPLTokenInfo[]> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const walletPublicKey = new PublicKey(walletAddress);

      // Get all token accounts owned by wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      return tokenAccounts.value.map((account) => {
        const accountInfo = account.account.data.parsed.info;
        
        return {
          balance: accountInfo.tokenAmount.uiAmountString || '0',
          balanceRaw: accountInfo.tokenAmount.amount,
          decimals: accountInfo.tokenAmount.decimals,
          mintAddress: accountInfo.mint,
          tokenAccountAddress: account.pubkey.toBase58(),
        };
      }).filter(token => parseFloat(token.balance) > 0); // Only non-zero balances
    } catch (error) {
      throw new Error(
        `Failed to get all tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get SPL token metadata (decimals, supply)
   * 
   * @param mintAddress - SPL token mint address
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Token metadata
   */
  static async getTokenMetadata(
    mintAddress: string,
    rpcUrl: string
  ): Promise<SPLTokenMetadata> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const mintPublicKey = new PublicKey(mintAddress);

      const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
      
      if (!mintInfo.value?.data || !('parsed' in mintInfo.value.data)) {
        throw new Error('Invalid mint address or not a token mint');
      }

      const parsedData = mintInfo.value.data.parsed.info;
      
      return {
        mintAddress,
        decimals: parsedData.decimals,
        supply: parsedData.supply ? 
          (BigInt(parsedData.supply) / BigInt(10 ** parsedData.decimals)).toString() : 
          undefined,
      };
    } catch (error) {
      throw new Error(
        `Failed to get token metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get token account address for a wallet and mint
   * 
   * @param walletAddress - User's Solana wallet address
   * @param mintAddress - SPL token mint address
   * @param rpcUrl - User's Solana RPC endpoint
   * @returns Token account address or null if not found
   */
  static async getTokenAccount(
    walletAddress: string,
    mintAddress: string,
    rpcUrl: string
  ): Promise<string | null> {
    try {
      const connection = new Connection(rpcUrl, 'confirmed');
      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(mintAddress);

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        { mint: mintPublicKey }
      );

      if (tokenAccounts.value.length === 0) {
        return null;
      }

      return tokenAccounts.value[0].pubkey.toBase58();
    } catch (error) {
      throw new Error(
        `Failed to get token account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if mint address is valid SPL token
   * 
   * @param mintAddress - Address to validate
   * @returns true if valid, false otherwise
   */
  static isValidMintAddress(mintAddress: string): boolean {
    try {
      new PublicKey(mintAddress);
      return true;
    } catch {
      return false;
    }
  }
}

