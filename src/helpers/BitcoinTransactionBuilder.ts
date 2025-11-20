/**
 * Bitcoin Transaction Builder
 * Provides UTXO selection, fee calculation, and transaction building for Bitcoin
 */

import { BitcoinBalanceChecker, BitcoinUTXO } from './BitcoinBalanceChecker';

export interface UnsignedBitcoinTransaction {
  utxos: BitcoinUTXO[];
  toAddress: string;
  amount: number;  // satoshis
  changeAddress: string;
  changeAmount: number;  // satoshis
  fee: number;  // satoshis
  byteFee: number;  // satoshis per byte
  totalInput: number;  // satoshis
  estimatedSize: number;  // bytes
}

export interface TransactionBuildOptions {
  /**
   * Target address
   */
  toAddress: string;
  
  /**
   * Amount to send in satoshis
   */
  amount: number;
  
  /**
   * Fee rate in satoshis per byte (default: 1)
   */
  feeRate?: number;
  
  /**
   * Address to send change to (defaults to sender address)
   */
  changeAddress?: string;
  
  /**
   * UTXO selection strategy (default: 'largest-first')
   */
  strategy?: 'largest-first' | 'smallest-first' | 'optimal';
  
  /**
   * API provider for fetching UTXOs (default: 'mempool.space')
   */
  apiProvider?: 'mempool.space' | 'blockchair.com' | 'blockchain.info';
}

/**
 * Bitcoin Transaction Builder
 * Handles UTXO selection, fee calculation, and transaction building
 */
export class BitcoinTransactionBuilder {
  /**
   * Estimate transaction size in bytes
   * Formula: (inputs * 148) + (outputs * 34) + 10
   * P2PKH: ~148 bytes per input, ~34 bytes per output
   * P2WPKH (SegWit): ~68 vBytes per input, ~31 vBytes per output
   */
  private static estimateTransactionSize(inputCount: number, outputCount: number, useSegwit: boolean = true): number {
    if (useSegwit) {
      // SegWit transaction size estimate (vBytes)
      return (inputCount * 68) + (outputCount * 31) + 10;
    } else {
      // Legacy transaction size estimate
      return (inputCount * 148) + (outputCount * 34) + 10;
    }
  }

  /**
   * Select UTXOs for transaction
   * Implements multiple selection strategies
   */
  private static selectUTXOs(
    utxos: BitcoinUTXO[],
    targetAmount: number,
    feeRate: number,
    strategy: 'largest-first' | 'smallest-first' | 'optimal' = 'largest-first'
  ): { selectedUTXOs: BitcoinUTXO[]; totalInput: number; fee: number; change: number } {
    // Sort UTXOs based on strategy
    let sortedUTXOs = [...utxos];
    
    switch (strategy) {
      case 'largest-first':
        sortedUTXOs.sort((a, b) => b.value - a.value);
        break;
      case 'smallest-first':
        sortedUTXOs.sort((a, b) => a.value - b.value);
        break;
      case 'optimal':
        // Optimal: try to find exact match or closest match
        sortedUTXOs.sort((a, b) => {
          const diffA = Math.abs(a.value - targetAmount);
          const diffB = Math.abs(b.value - targetAmount);
          return diffA - diffB;
        });
        break;
    }

    const selectedUTXOs: BitcoinUTXO[] = [];
    let totalInput = 0;
    let estimatedFee = 0;

    // Select UTXOs until we have enough to cover amount + fee
    for (const utxo of sortedUTXOs) {
      selectedUTXOs.push(utxo);
      totalInput += utxo.value;

      // Calculate fee based on current transaction size
      // Assume 1 output initially, add change output if needed
      const outputCount = totalInput > targetAmount + estimatedFee + 546 ? 2 : 1;  // 546 is dust limit
      const txSize = this.estimateTransactionSize(selectedUTXOs.length, outputCount, true);
      estimatedFee = Math.ceil(txSize * feeRate);

      // Check if we have enough
      if (totalInput >= targetAmount + estimatedFee) {
        const change = totalInput - targetAmount - estimatedFee;
        
        // If change is below dust limit (546 sats), add it to fee
        if (change > 0 && change < 546) {
          estimatedFee += change;
          return { selectedUTXOs, totalInput, fee: estimatedFee, change: 0 };
        }
        
        return { selectedUTXOs, totalInput, fee: estimatedFee, change };
      }
    }

    // Not enough funds
    throw new Error(`Insufficient funds: need ${targetAmount + estimatedFee} satoshis, have ${totalInput} satoshis`);
  }

  /**
   * Build unsigned Bitcoin transaction
   * @param fromAddress Sender Bitcoin address
   * @param options Transaction build options
   */
  static async buildBTCTransaction(
    fromAddress: string,
    options: TransactionBuildOptions
  ): Promise<UnsignedBitcoinTransaction> {
    const {
      toAddress,
      amount,
      feeRate = 1,
      changeAddress = fromAddress,
      strategy = 'largest-first',
      apiProvider = 'mempool.space',
    } = options;

    // Validate inputs
    if (!BitcoinBalanceChecker.isValidAddress(fromAddress)) {
      throw new Error('Invalid sender address');
    }
    if (!BitcoinBalanceChecker.isValidAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    if (amount < 546) {
      throw new Error('Amount is below dust limit (546 satoshis)');
    }

    // Fetch UTXOs for address
    const utxos = await BitcoinBalanceChecker.getUTXOs(fromAddress, apiProvider);

    if (utxos.length === 0) {
      throw new Error('No UTXOs found for address');
    }

    // Select UTXOs
    const { selectedUTXOs, totalInput, fee, change } = this.selectUTXOs(
      utxos,
      amount,
      feeRate,
      strategy
    );

    // Calculate final transaction size
    const outputCount = change > 0 ? 2 : 1;
    const estimatedSize = this.estimateTransactionSize(selectedUTXOs.length, outputCount, true);

    return {
      utxos: selectedUTXOs,
      toAddress,
      amount,
      changeAddress,
      changeAmount: change,
      fee,
      byteFee: feeRate,
      totalInput,
      estimatedSize,
    };
  }

  /**
   * Estimate transaction cost
   * @param fromAddress Sender address
   * @param amount Amount to send in satoshis
   * @param feeRate Fee rate in satoshis per byte
   * @param apiProvider API provider for fetching UTXOs
   */
  static async estimateTransactionCost(
    fromAddress: string,
    amount: number,
    feeRate: number = 1,
    apiProvider: 'mempool.space' | 'blockchair.com' | 'blockchain.info' = 'mempool.space'
  ): Promise<{ fee: number; total: number; estimatedSize: number }> {
    const utxos = await BitcoinBalanceChecker.getUTXOs(fromAddress, apiProvider);

    if (utxos.length === 0) {
      throw new Error('No UTXOs found for address');
    }

    try {
      const { selectedUTXOs, fee } = this.selectUTXOs(utxos, amount, feeRate, 'largest-first');
      const outputCount = (selectedUTXOs.reduce((sum, u) => sum + u.value, 0) - amount - fee) > 546 ? 2 : 1;
      const estimatedSize = this.estimateTransactionSize(selectedUTXOs.length, outputCount, true);

      return {
        fee,
        total: amount + fee,
        estimatedSize,
      };
    } catch (error) {
      throw new Error(`Failed to estimate cost: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recommended fee rates
   * @param apiProvider API provider (default: mempool.space)
   */
  static async getRecommendedFees(
    apiProvider: 'mempool.space' = 'mempool.space'
  ): Promise<{ fastestFee: number; halfHourFee: number; hourFee: number; economyFee: number; minimumFee: number }> {
    if (apiProvider === 'mempool.space') {
      try {
        const response = await fetch('https://mempool.space/api/v1/fees/recommended');
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        return {
          fastestFee: data.fastestFee,
          halfHourFee: data.halfHourFee,
          hourFee: data.hourFee,
          economyFee: data.economyFee || data.hourFee,
          minimumFee: data.minimumFee || 1,
        };
      } catch (error) {
        // Return conservative defaults if API fails
        return {
          fastestFee: 20,
          halfHourFee: 10,
          hourFee: 5,
          economyFee: 2,
          minimumFee: 1,
        };
      }
    }

    // Default conservative values
    return {
      fastestFee: 20,
      halfHourFee: 10,
      hourFee: 5,
      economyFee: 2,
      minimumFee: 1,
    };
  }

  /**
   * Validate transaction before signing
   * @param tx Unsigned transaction to validate
   */
  static validateTransaction(tx: UnsignedBitcoinTransaction): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (tx.utxos.length === 0) {
      errors.push('No UTXOs selected');
    }

    if (!BitcoinBalanceChecker.isValidAddress(tx.toAddress)) {
      errors.push('Invalid recipient address');
    }

    if (!BitcoinBalanceChecker.isValidAddress(tx.changeAddress)) {
      errors.push('Invalid change address');
    }

    if (tx.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (tx.amount < 546) {
      errors.push('Amount is below dust limit (546 satoshis)');
    }

    if (tx.changeAmount > 0 && tx.changeAmount < 546) {
      errors.push('Change amount is below dust limit (546 satoshis)');
    }

    if (tx.totalInput < tx.amount + tx.fee) {
      errors.push('Insufficient input amount');
    }

    if (tx.fee <= 0) {
      errors.push('Fee must be greater than 0');
    }

    // Check for double-spend (duplicate UTXOs)
    const utxoIds = new Set();
    for (const utxo of tx.utxos) {
      const id = `${utxo.txid}:${utxo.vout}`;
      if (utxoIds.has(id)) {
        errors.push(`Duplicate UTXO: ${id}`);
      }
      utxoIds.add(id);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert satoshis to BTC
   */
  static satoshisToBTC(satoshis: number): string {
    return (satoshis / 100000000).toFixed(8);
  }

  /**
   * Convert BTC to satoshis
   */
  static btcToSatoshis(btc: string | number): number {
    return Math.round(parseFloat(btc.toString()) * 100000000);
  }
}

