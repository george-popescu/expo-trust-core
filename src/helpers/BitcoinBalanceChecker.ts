/**
 * Bitcoin Balance Checker
 * Supports multiple APIs for fetching Bitcoin balance and UTXOs
 */

export interface BitcoinUTXO {
  txid: string;
  vout: number;
  value: number;  // satoshis
  scriptPubKey: string;
  confirmations?: number;
}

export interface BitcoinBalanceResult {
  address: string;
  balance: string;  // in BTC
  balanceSat: number;  // in satoshis
  unconfirmedBalance?: string;
  txCount?: number;
  utxos?: BitcoinUTXO[];
}

export interface BitcoinAPIProvider {
  name: string;
  checkBalance(address: string): Promise<BitcoinBalanceResult>;
  getUTXOs(address: string): Promise<BitcoinUTXO[]>;
}

/**
 * Blockchain.info API provider
 */
class BlockchainInfoProvider implements BitcoinAPIProvider {
  name = 'blockchain.info';
  private baseUrl = 'https://blockchain.info';

  async checkBalance(address: string): Promise<BitcoinBalanceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/balance?active=${address}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const addressData = data[address];

      if (!addressData) {
        throw new Error('Address not found in response');
      }

      return {
        address,
        balance: (addressData.final_balance / 100000000).toFixed(8),
        balanceSat: addressData.final_balance,
        unconfirmedBalance: (addressData.total_received / 100000000).toFixed(8),
        txCount: addressData.n_tx,
      };
    } catch (error) {
      throw new Error(`Blockchain.info API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUTXOs(address: string): Promise<BitcoinUTXO[]> {
    try {
      const response = await fetch(`${this.baseUrl}/unspent?active=${address}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.unspent_outputs || !Array.isArray(data.unspent_outputs)) {
        return [];
      }

      return data.unspent_outputs.map((utxo: any) => ({
        txid: utxo.tx_hash_big_endian,
        vout: utxo.tx_output_n,
        value: utxo.value,
        scriptPubKey: utxo.script,
        confirmations: utxo.confirmations,
      }));
    } catch (error) {
      throw new Error(`Blockchain.info UTXO error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Blockchair API provider
 */
class BlockchairProvider implements BitcoinAPIProvider {
  name = 'blockchair.com';
  private baseUrl = 'https://api.blockchair.com/bitcoin';

  async checkBalance(address: string): Promise<BitcoinBalanceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboards/address/${address}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      const data = result.data[address];

      if (!data) {
        throw new Error('Address not found in response');
      }

      return {
        address,
        balance: (data.address.balance / 100000000).toFixed(8),
        balanceSat: data.address.balance,
        unconfirmedBalance: ((data.address.balance + data.address.unconfirmed_balance) / 100000000).toFixed(8),
        txCount: data.address.transaction_count,
      };
    } catch (error) {
      throw new Error(`Blockchair API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUTXOs(address: string): Promise<BitcoinUTXO[]> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboards/address/${address}?transaction_details=true`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      const data = result.data[address];

      if (!data || !data.utxo) {
        return [];
      }

      return data.utxo.map((utxo: any) => ({
        txid: utxo.transaction_hash,
        vout: utxo.index,
        value: utxo.value,
        scriptPubKey: utxo.script_hex,
        confirmations: result.context.state - utxo.block_id,
      }));
    } catch (error) {
      throw new Error(`Blockchair UTXO error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Mempool.space API provider (recommended for production)
 */
class MempoolSpaceProvider implements BitcoinAPIProvider {
  name = 'mempool.space';
  private baseUrl = 'https://mempool.space/api';

  async checkBalance(address: string): Promise<BitcoinBalanceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/address/${address}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        address,
        balance: ((data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000).toFixed(8),
        balanceSat: data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum,
        unconfirmedBalance: ((data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum) / 100000000).toFixed(8),
        txCount: data.chain_stats.tx_count,
      };
    } catch (error) {
      throw new Error(`Mempool.space API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUTXOs(address: string): Promise<BitcoinUTXO[]> {
    try {
      const response = await fetch(`${this.baseUrl}/address/${address}/utxo`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const utxos = await response.json();

      if (!Array.isArray(utxos)) {
        return [];
      }

      // Fetch scriptPubKey for each UTXO (requires additional API call)
      return Promise.all(utxos.map(async (utxo: any) => {
        try {
          const txResponse = await fetch(`${this.baseUrl}/tx/${utxo.txid}`);
          const txData = await txResponse.json();
          const output = txData.vout[utxo.vout];

          return {
            txid: utxo.txid,
            vout: utxo.vout,
            value: utxo.value,
            scriptPubKey: output.scriptpubkey,
            confirmations: utxo.status.block_height ? utxo.status.block_height : 0,
          };
        } catch {
          // If scriptPubKey fetch fails, return without it
          return {
            txid: utxo.txid,
            vout: utxo.vout,
            value: utxo.value,
            scriptPubKey: '',
            confirmations: utxo.status.block_height ? utxo.status.block_height : 0,
          };
        }
      }));
    } catch (error) {
      throw new Error(`Mempool.space UTXO error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Bitcoin Balance Checker
 * Provides methods to check BTC balance and fetch UTXOs from multiple APIs
 */
export class BitcoinBalanceChecker {
  private static providers: Record<string, BitcoinAPIProvider> = {
    'mempool.space': new MempoolSpaceProvider(),
    'blockchair.com': new BlockchairProvider(),
    'blockchain.info': new BlockchainInfoProvider(),
  };

  /**
   * Check Bitcoin balance for an address
   * @param address Bitcoin address
   * @param apiProvider API provider to use (default: mempool.space)
   */
  static async checkBTC(
    address: string,
    apiProvider: 'mempool.space' | 'blockchair.com' | 'blockchain.info' = 'mempool.space'
  ): Promise<BitcoinBalanceResult> {
    const provider = this.providers[apiProvider];
    if (!provider) {
      throw new Error(`Unknown API provider: ${apiProvider}`);
    }

    return await provider.checkBalance(address);
  }

  /**
   * Get UTXOs for a Bitcoin address
   * @param address Bitcoin address
   * @param apiProvider API provider to use (default: mempool.space)
   */
  static async getUTXOs(
    address: string,
    apiProvider: 'mempool.space' | 'blockchair.com' | 'blockchain.info' = 'mempool.space'
  ): Promise<BitcoinUTXO[]> {
    const provider = this.providers[apiProvider];
    if (!provider) {
      throw new Error(`Unknown API provider: ${apiProvider}`);
    }

    return await provider.getUTXOs(address);
  }

  /**
   * Check multiple addresses in parallel
   * @param addresses Array of Bitcoin addresses
   * @param apiProvider API provider to use (default: mempool.space)
   */
  static async checkMultipleBTC(
    addresses: string[],
    apiProvider: 'mempool.space' | 'blockchair.com' | 'blockchain.info' = 'mempool.space'
  ): Promise<BitcoinBalanceResult[]> {
    return await Promise.all(addresses.map(addr => this.checkBTC(addr, apiProvider)));
  }

  /**
   * Get total balance from UTXOs
   * @param utxos Array of UTXOs
   */
  static getTotalBalance(utxos: BitcoinUTXO[]): { btc: string; satoshis: number } {
    const totalSat = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    return {
      btc: (totalSat / 100000000).toFixed(8),
      satoshis: totalSat,
    };
  }

  /**
   * Validate Bitcoin address format
   * @param address Address to validate
   */
  static isValidAddress(address: string): boolean {
    // Basic validation - starts with 1, 3, or bc1
    return /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
  }
}

