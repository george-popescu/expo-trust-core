/**
 * Dogecoin Transaction Builder
 * Provides UTXO selection, fee calculation, and transaction building for Dogecoin
 */

import { DogecoinBalanceChecker, DogecoinUTXO } from './DogecoinBalanceChecker';

export interface UnsignedDogecoinTransaction {
  utxos: DogecoinUTXO[];
  toAddress: string;
  amount: number;  // koinu (1 DOGE = 100,000,000 koinu)
  changeAddress: string;
  changeAmount: number;  // koinu
  fee: number;  // koinu
  byteFee: number;  // koinu per byte
  totalInput: number;  // koinu
  estimatedSize: number;  // bytes
}

export interface TransactionBuildOptions {
  /**
   * Target address
   */
  toAddress: string;
  
  /**
   * Amount to send in koinu (1 DOGE = 100,000,000 koinu)
   */
  amount: number;
  
  /**
   * Fee rate in koinu per byte (default: 100000 koinu/byte = 0.001 DOGE/byte)
   * Dogecoin typically uses higher fees than Bitcoin
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
   * API provider for fetching UTXOs (default: 'blockchair.com')
   */
  apiProvider?: 'blockchair.com' | 'chain.so' | 'dogechain.info';
}

/**
 * Dogecoin Transaction Builder
 * Handles UTXO selection, fee calculation, and transaction building
 */
export class DogecoinTransactionBuilder {
  /**
   * Estimate transaction size in bytes
   * Formula: (inputs * 148) + (outputs * 34) + 10
   * Dogecoin uses legacy transaction format (similar to Bitcoin pre-SegWit)
   */
  private static estimateTransactionSize(inputCount: number, outputCount: number): number {
    // Legacy transaction size estimate
    return (inputCount * 148) + (outputCount * 34) + 10;
  }

  /**
   * Select UTXOs for transaction
   * Implements multiple selection strategies
   */
  private static selectUTXOs(
    utxos: DogecoinUTXO[],
    targetAmount: number,
    feeRate: number,
    strategy: 'largest-first' | 'smallest-first' | 'optimal' = 'largest-first'
  ): { selectedUTXOs: DogecoinUTXO[]; totalInput: number; fee: number; change: number } {
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

    const selectedUTXOs: DogecoinUTXO[] = [];
    let totalInput = 0;
    let estimatedFee = 0;

    // Select UTXOs until we have enough to cover amount + fee
    for (const utxo of sortedUTXOs) {
      selectedUTXOs.push(utxo);
      totalInput += utxo.value;

      // Calculate fee based on current transaction size
      // Dogecoin dust limit is 1 DOGE (100,000,000 koinu)
      const dustLimit = 100000000;
      const outputCount = totalInput > targetAmount + estimatedFee + dustLimit ? 2 : 1;
      const txSize = this.estimateTransactionSize(selectedUTXOs.length, outputCount);
      estimatedFee = Math.ceil(txSize * feeRate);

      // Check if we have enough
      if (totalInput >= targetAmount + estimatedFee) {
        const change = totalInput - targetAmount - estimatedFee;
        
        // If change is below dust limit, add it to fee
        if (change > 0 && change < dustLimit) {
          estimatedFee += change;
          return { selectedUTXOs, totalInput, fee: estimatedFee, change: 0 };
        }
        
        return { selectedUTXOs, totalInput, fee: estimatedFee, change };
      }
    }

    // Not enough funds
    throw new Error(`Insufficient funds: need ${targetAmount + estimatedFee} koinu, have ${totalInput} koinu`);
  }

  /**
   * Build unsigned Dogecoin transaction
   * @param fromAddress Sender Dogecoin address
   * @param options Transaction build options
   */
  static async buildDOGETransaction(
    fromAddress: string,
    options: TransactionBuildOptions
  ): Promise<UnsignedDogecoinTransaction> {
    const {
      toAddress,
      amount,
      feeRate = 100000,  // 0.001 DOGE per byte (typical for Dogecoin)
      changeAddress = fromAddress,
      strategy = 'largest-first',
      apiProvider = 'blockchair.com',
    } = options;

    // Validate inputs
    if (!DogecoinBalanceChecker.isValidAddress(fromAddress)) {
      throw new Error('Invalid sender address');
    }
    if (!DogecoinBalanceChecker.isValidAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    // Dogecoin dust limit is 1 DOGE (100,000,000 koinu)
    if (amount < 100000000) {
      throw new Error('Amount is below dust limit (1 DOGE)');
    }

    // Fetch UTXOs for address
    const utxos = await DogecoinBalanceChecker.getUTXOs(fromAddress, apiProvider);

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
    const estimatedSize = this.estimateTransactionSize(selectedUTXOs.length, outputCount);

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
   * @param amount Amount to send in koinu
   * @param feeRate Fee rate in koinu per byte
   * @param apiProvider API provider for fetching UTXOs
   */
  static async estimateTransactionCost(
    fromAddress: string,
    amount: number,
    feeRate: number = 100000,
    apiProvider: 'blockchair.com' | 'chain.so' | 'dogechain.info' = 'blockchair.com'
  ): Promise<{ fee: number; total: number; estimatedSize: number }> {
    const utxos = await DogecoinBalanceChecker.getUTXOs(fromAddress, apiProvider);

    if (utxos.length === 0) {
      throw new Error('No UTXOs found for address');
    }

    try {
      const { selectedUTXOs, fee } = this.selectUTXOs(utxos, amount, feeRate, 'largest-first');
      const dustLimit = 100000000;  // 1 DOGE
      const outputCount = (selectedUTXOs.reduce((sum, u) => sum + u.value, 0) - amount - fee) > dustLimit ? 2 : 1;
      const estimatedSize = this.estimateTransactionSize(selectedUTXOs.length, outputCount);

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
   * Get recommended fee rates for Dogecoin
   * Dogecoin typically uses fixed fees of 0.01-1 DOGE per transaction
   */
  static getRecommendedFees(): {
    fastFee: number;
    standardFee: number;
    economyFee: number;
    minimumFee: number;
  } {
    // Dogecoin recommended fees in koinu per byte
    return {
      fastFee: 1000000,      // 0.01 DOGE per byte (fast)
      standardFee: 100000,   // 0.001 DOGE per byte (standard)
      economyFee: 10000,     // 0.0001 DOGE per byte (economy)
      minimumFee: 1000,      // 0.00001 DOGE per byte (minimum)
    };
  }

  /**
   * Validate transaction before signing
   * @param tx Unsigned transaction to validate
   */
  static validateTransaction(tx: UnsignedDogecoinTransaction): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (tx.utxos.length === 0) {
      errors.push('No UTXOs selected');
    }

    if (!DogecoinBalanceChecker.isValidAddress(tx.toAddress)) {
      errors.push('Invalid recipient address');
    }

    if (!DogecoinBalanceChecker.isValidAddress(tx.changeAddress)) {
      errors.push('Invalid change address');
    }

    if (tx.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    // Dogecoin dust limit is 1 DOGE (100,000,000 koinu)
    const dustLimit = 100000000;
    if (tx.amount < dustLimit) {
      errors.push('Amount is below dust limit (1 DOGE)');
    }

    if (tx.changeAmount > 0 && tx.changeAmount < dustLimit) {
      errors.push('Change amount is below dust limit (1 DOGE)');
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
   * Convert koinu to DOGE
   */
  static koinuToDOGE(koinu: number): string {
    return (koinu / 100000000).toFixed(8);
  }

  /**
   * Convert DOGE to koinu
   */
  static dogeToKoinu(doge: string | number): number {
    return Math.round(parseFloat(doge.toString()) * 100000000);
  }
}

