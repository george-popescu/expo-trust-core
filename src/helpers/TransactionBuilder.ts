/**
 * TransactionBuilder - Helper for building unsigned EVM transactions
 * 
 * Users provide RPC URLs for gas estimation and nonce fetching
 * Transactions are built but NOT signed - use SDK signing after
 */

import { ethers } from 'ethers';

export interface UnsignedTransaction {
  to: string;
  from: string;
  value: string;
  data: string;
  nonce: number;
  gasLimit: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  chainId: number;
  type?: number; // 0 = Legacy, 2 = EIP-1559
}

export interface TransactionEstimate {
  gasLimit: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost: string; // In ETH/native token
}

export class TransactionBuilder {
  /**
   * Build unsigned EVM transaction (native token transfer)
   * 
   * @param from - Sender address
   * @param to - Recipient address
   * @param value - Amount in ETH (e.g., "0.001")
   * @param rpcUrl - User's RPC endpoint for gas/nonce estimation
   * @param gasMultiplier - Optional gas multiplier (default: 1.2 = 20% buffer)
   * @returns Unsigned transaction ready for signing
   * 
   * @example
   * ```typescript
   * const unsignedTx = await TransactionBuilder.buildEVMTransaction(
   *   myAddress,
   *   recipientAddress,
   *   '0.5', // 0.5 ETH
   *   myRpcUrl
   * );
   * 
   * // Sign with SDK
   * const signature = await Message.sign(mnemonic, JSON.stringify(unsignedTx), CoinType.Ethereum);
   * ```
   */
  static async buildEVMTransaction(
    from: string,
    to: string,
    value: string,
    rpcUrl: string,
    gasMultiplier: number = 1.2
  ): Promise<UnsignedTransaction> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Fetch nonce, chain ID, and fee data in parallel
      const [nonce, network, feeData] = await Promise.all([
        provider.getTransactionCount(from, 'latest'),
        provider.getNetwork(),
        provider.getFeeData(),
      ]);

      const chainId = Number(network.chainId);
      const valueWei = ethers.parseEther(value);

      // Estimate gas for the transaction
      const gasEstimate = await provider.estimateGas({
        from,
        to,
        value: valueWei,
      });

      const gasLimit = Math.ceil(Number(gasEstimate) * gasMultiplier).toString();

      // Build transaction based on EIP-1559 support
      const tx: UnsignedTransaction = {
        from,
        to,
        value: valueWei.toString(),
        data: '0x',
        nonce,
        gasLimit,
        chainId,
      };

      // Use EIP-1559 if available, otherwise legacy
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        tx.type = 2; // EIP-1559
        tx.maxFeePerGas = feeData.maxFeePerGas.toString();
        tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.toString();
      } else if (feeData.gasPrice) {
        tx.type = 0; // Legacy
        tx.gasPrice = feeData.gasPrice.toString();
      } else {
        throw new Error('Unable to fetch gas prices from network');
      }

      return tx;
    } catch (error) {
      throw new Error(
        `Failed to build transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build unsigned ERC20 token transfer transaction
   * 
   * @param from - Sender address
   * @param tokenAddress - ERC20 token contract address
   * @param recipientAddress - Token recipient address
   * @param amount - Amount in token units (e.g., "100" USDC)
   * @param rpcUrl - User's RPC endpoint
   * @param gasMultiplier - Optional gas multiplier
   * @returns Unsigned transaction with encoded ERC20 transfer
   * 
   * @example
   * ```typescript
   * const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
   * const unsignedTx = await TransactionBuilder.buildERC20Transfer(
   *   myAddress,
   *   usdcAddress,
   *   recipientAddress,
   *   '100', // 100 USDC
   *   myRpcUrl
   * );
   * ```
   */
  static async buildERC20Transfer(
    from: string,
    tokenAddress: string,
    recipientAddress: string,
    amount: string,
    rpcUrl: string,
    gasMultiplier: number = 1.2
  ): Promise<UnsignedTransaction> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Get token decimals
      const tokenAbi = ['function decimals() view returns (uint8)'];
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
      const decimals = await tokenContract.decimals();

      // Encode transfer function call
      const iface = new ethers.Interface([
        'function transfer(address to, uint256 amount)',
      ]);
      const data = iface.encodeFunctionData('transfer', [
        recipientAddress,
        ethers.parseUnits(amount, decimals),
      ]);

      // Fetch nonce, chain ID, and fee data in parallel
      const [nonce, network, feeData] = await Promise.all([
        provider.getTransactionCount(from, 'latest'),
        provider.getNetwork(),
        provider.getFeeData(),
      ]);

      const chainId = Number(network.chainId);

      // Estimate gas
      const gasEstimate = await provider.estimateGas({
        from,
        to: tokenAddress,
        data,
      });

      const gasLimit = Math.ceil(Number(gasEstimate) * gasMultiplier).toString();

      const tx: UnsignedTransaction = {
        from,
        to: tokenAddress, // Contract address
        value: '0', // No ETH sent
        data,
        nonce,
        gasLimit,
        chainId,
      };

      // Use EIP-1559 if available
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        tx.type = 2;
        tx.maxFeePerGas = feeData.maxFeePerGas.toString();
        tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.toString();
      } else if (feeData.gasPrice) {
        tx.type = 0;
        tx.gasPrice = feeData.gasPrice.toString();
      } else {
        throw new Error('Unable to fetch gas prices');
      }

      return tx;
    } catch (error) {
      throw new Error(
        `Failed to build ERC20 transfer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Estimate transaction cost
   * 
   * @param from - Sender address
   * @param to - Recipient address
   * @param value - Amount in ETH (default: "0" for contract calls)
   * @param data - Transaction data (default: "0x" for simple transfers)
   * @param rpcUrl - User's RPC endpoint
   * @returns Estimated gas and cost
   */
  static async estimateTransactionCost(
    from: string,
    to: string,
    rpcUrl: string,
    value: string = '0',
    data: string = '0x'
  ): Promise<TransactionEstimate> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const valueWei = value !== '0' ? ethers.parseEther(value) : 0n;

      const [gasEstimate, feeData] = await Promise.all([
        provider.estimateGas({ from, to, value: valueWei, data }),
        provider.getFeeData(),
      ]);

      const estimate: TransactionEstimate = {
        gasLimit: gasEstimate.toString(),
        estimatedCost: '0',
      };

      // Calculate cost based on fee type
      if (feeData.maxFeePerGas) {
        estimate.maxFeePerGas = feeData.maxFeePerGas.toString();
        estimate.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas?.toString();
        const cost = gasEstimate * feeData.maxFeePerGas;
        estimate.estimatedCost = ethers.formatEther(cost);
      } else if (feeData.gasPrice) {
        estimate.gasPrice = feeData.gasPrice.toString();
        const cost = gasEstimate * feeData.gasPrice;
        estimate.estimatedCost = ethers.formatEther(cost);
      }

      return estimate;
    } catch (error) {
      throw new Error(
        `Failed to estimate cost: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build custom contract call transaction
   * 
   * @param from - Sender address
   * @param contractAddress - Contract address
   * @param encodedData - ABI-encoded function call data
   * @param value - ETH to send with call (default: "0")
   * @param rpcUrl - User's RPC endpoint
   * @param gasMultiplier - Optional gas multiplier
   * @returns Unsigned transaction
   */
  static async buildContractCall(
    from: string,
    contractAddress: string,
    encodedData: string,
    rpcUrl: string,
    value: string = '0',
    gasMultiplier: number = 1.2
  ): Promise<UnsignedTransaction> {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const valueWei = value !== '0' ? ethers.parseEther(value) : 0n;

      const [nonce, network, feeData, gasEstimate] = await Promise.all([
        provider.getTransactionCount(from, 'latest'),
        provider.getNetwork(),
        provider.getFeeData(),
        provider.estimateGas({
          from,
          to: contractAddress,
          value: valueWei,
          data: encodedData,
        }),
      ]);

      const chainId = Number(network.chainId);
      const gasLimit = Math.ceil(Number(gasEstimate) * gasMultiplier).toString();

      const tx: UnsignedTransaction = {
        from,
        to: contractAddress,
        value: valueWei.toString(),
        data: encodedData,
        nonce,
        gasLimit,
        chainId,
      };

      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        tx.type = 2;
        tx.maxFeePerGas = feeData.maxFeePerGas.toString();
        tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.toString();
      } else if (feeData.gasPrice) {
        tx.type = 0;
        tx.gasPrice = feeData.gasPrice.toString();
      }

      return tx;
    } catch (error) {
      throw new Error(
        `Failed to build contract call: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

