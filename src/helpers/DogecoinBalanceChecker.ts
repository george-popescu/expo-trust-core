/**
 * Dogecoin Balance Checker
 * Supports multiple APIs for fetching Dogecoin balance and UTXOs
 */

export interface DogecoinUTXO {
  txid: string;
  vout: number;
  value: number;  // satoshis (koinu in DOGE)
  scriptPubKey: string;
  confirmations?: number;
}

export interface DogecoinBalanceResult {
  address: string;
  balance: string;  // in DOGE
  balanceSat: number;  // in koinu (1 DOGE = 100,000,000 koinu)
  unconfirmedBalance?: string;
  txCount?: number;
  utxos?: DogecoinUTXO[];
}

export interface DogecoinAPIProvider {
  name: string;
  setBaseUrl?(url: string): void;
  checkBalance(address: string): Promise<DogecoinBalanceResult>;
  getUTXOs(address: string): Promise<DogecoinUTXO[]>;
}

/**
 * Blockchair API provider for Dogecoin
 */
class BlockchairDogecoinProvider implements DogecoinAPIProvider {
  name = 'blockchair.com';
  private baseUrl = 'https://api.blockchair.com/dogecoin';

  setBaseUrl(url: string): void { this.baseUrl = url; }

  async checkBalance(address: string): Promise<DogecoinBalanceResult> {
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

  async getUTXOs(address: string): Promise<DogecoinUTXO[]> {
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
        confirmations: utxo.block_id != null ? result.context.state - utxo.block_id : 0,
      }));
    } catch (error) {
      throw new Error(`Blockchair UTXO error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Dogechain.info API provider (legacy but still works)
 */
class DogechainProvider implements DogecoinAPIProvider {
  name = 'dogechain.info';
  private baseUrl = 'https://dogechain.info/api/v1';

  setBaseUrl(url: string): void { this.baseUrl = url; }

  async checkBalance(address: string): Promise<DogecoinBalanceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/address/balance/${address}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        address,
        balance: data.balance,
        balanceSat: Math.round(parseFloat(data.balance) * 100000000),
      };
    } catch (error) {
      throw new Error(`Dogechain API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUTXOs(address: string): Promise<DogecoinUTXO[]> {
    try {
      const response = await fetch(`${this.baseUrl}/unspent/${address}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.unspent_outputs || !Array.isArray(data.unspent_outputs)) {
        return [];
      }

      return data.unspent_outputs.map((utxo: any) => ({
        txid: utxo.tx_hash,
        vout: utxo.tx_output_n,
        value: utxo.value,
        scriptPubKey: utxo.script || '',
        confirmations: utxo.confirmations,
      }));
    } catch (error) {
      throw new Error(`Dogechain UTXO error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * SoChain API provider for Dogecoin
 */
class SoChainProvider implements DogecoinAPIProvider {
  name = 'chain.so';
  private baseUrl = 'https://sochain.com/api/v2';

  setBaseUrl(url: string): void { this.baseUrl = url; }

  async checkBalance(address: string): Promise<DogecoinBalanceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/get_address_balance/DOGE/${address}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.data?.error || 'API request failed');
      }

      const data = result.data;

      return {
        address,
        balance: data.confirmed_balance,
        balanceSat: Math.round(parseFloat(data.confirmed_balance) * 100000000),
        unconfirmedBalance: data.unconfirmed_balance,
      };
    } catch (error) {
      throw new Error(`SoChain API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUTXOs(address: string): Promise<DogecoinUTXO[]> {
    try {
      const response = await fetch(`${this.baseUrl}/get_tx_unspent/DOGE/${address}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.data?.error || 'API request failed');
      }

      const txs = result.data.txs;

      if (!Array.isArray(txs)) {
        return [];
      }

      return txs.map((utxo: any) => ({
        txid: utxo.txid,
        vout: utxo.output_no,
        value: Math.round(parseFloat(utxo.value) * 100000000),
        scriptPubKey: utxo.script_hex || '',
        confirmations: utxo.confirmations,
      }));
    } catch (error) {
      throw new Error(`SoChain UTXO error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Dogecoin Balance Checker
 * Provides methods to check DOGE balance and fetch UTXOs from multiple APIs
 */
export type DogecoinProviderName = 'blockchair.com' | 'chain.so' | 'dogechain.info' | (string & {});

export class DogecoinBalanceChecker {
  private static providers: Record<string, DogecoinAPIProvider> = {
    'blockchair.com': new BlockchairDogecoinProvider(),
    'chain.so': new SoChainProvider(),
    'dogechain.info': new DogechainProvider(),
  };

  private static fallbackOrder: string[] = ['blockchair.com', 'chain.so', 'dogechain.info'];

  /**
   * Configure a built-in provider's base URL
   * @param providerName Name of the provider to configure
   * @param baseUrl Custom base URL to use
   */
  static configure(providerName: DogecoinProviderName, baseUrl: string): void {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}. Use registerProvider() for custom providers.`);
    }
    if (!provider.setBaseUrl) {
      throw new Error(`Provider ${providerName} does not support URL configuration.`);
    }
    provider.setBaseUrl(baseUrl);
  }

  /**
   * Register a custom API provider
   * @param name Unique name for the provider
   * @param provider Provider implementation
   */
  static registerProvider(name: string, provider: DogecoinAPIProvider): void {
    this.providers[name] = provider;
  }

  /**
   * Set the fallback order for providers
   * @param order Array of provider names in priority order
   */
  static setFallbackOrder(order: string[]): void {
    this.fallbackOrder = order;
  }

  /**
   * Check Dogecoin balance for an address
   * @param address Dogecoin address
   * @param apiProvider API provider to use (default: blockchair.com)
   */
  static async checkDOGE(
    address: string,
    apiProvider: DogecoinProviderName = 'blockchair.com'
  ): Promise<DogecoinBalanceResult> {
    const provider = this.providers[apiProvider];
    if (!provider) {
      throw new Error(`Unknown API provider: ${apiProvider}`);
    }

    return await provider.checkBalance(address);
  }

  /**
   * Check Dogecoin balance with automatic fallback across providers
   * Tries each provider in fallback order until one succeeds
   * @param address Dogecoin address
   */
  static async checkDOGEWithFallback(address: string): Promise<DogecoinBalanceResult> {
    const errors: string[] = [];

    for (const providerName of this.fallbackOrder) {
      const provider = this.providers[providerName];
      if (!provider) continue;

      try {
        return await provider.checkBalance(address);
      } catch (error) {
        errors.push(`${providerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw new Error(`All Dogecoin API providers failed:\n${errors.join('\n')}`);
  }

  /**
   * Get UTXOs for a Dogecoin address
   * @param address Dogecoin address
   * @param apiProvider API provider to use (default: blockchair.com)
   */
  static async getUTXOs(
    address: string,
    apiProvider: DogecoinProviderName = 'blockchair.com'
  ): Promise<DogecoinUTXO[]> {
    const provider = this.providers[apiProvider];
    if (!provider) {
      throw new Error(`Unknown API provider: ${apiProvider}`);
    }

    return await provider.getUTXOs(address);
  }

  /**
   * Get UTXOs with automatic fallback across providers
   * @param address Dogecoin address
   */
  static async getUTXOsWithFallback(address: string): Promise<DogecoinUTXO[]> {
    const errors: string[] = [];

    for (const providerName of this.fallbackOrder) {
      const provider = this.providers[providerName];
      if (!provider) continue;

      try {
        return await provider.getUTXOs(address);
      } catch (error) {
        errors.push(`${providerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw new Error(`All Dogecoin UTXO providers failed:\n${errors.join('\n')}`);
  }

  /**
   * Check multiple addresses in parallel
   * @param addresses Array of Dogecoin addresses
   * @param apiProvider API provider to use (default: blockchair.com)
   */
  static async checkMultipleDOGE(
    addresses: string[],
    apiProvider: DogecoinProviderName = 'blockchair.com'
  ): Promise<DogecoinBalanceResult[]> {
    return await Promise.all(addresses.map(addr => this.checkDOGE(addr, apiProvider)));
  }

  /**
   * Get total balance from UTXOs
   * @param utxos Array of UTXOs
   */
  static getTotalBalance(utxos: DogecoinUTXO[]): { doge: string; koinu: number } {
    const totalKoinu = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    return {
      doge: (totalKoinu / 100000000).toFixed(8),
      koinu: totalKoinu,
    };
  }

  /**
   * Validate Dogecoin address format
   * @param address Address to validate
   */
  static isValidAddress(address: string): boolean {
    // Dogecoin addresses start with D or 9 (multisig) or A (P2SH)
    return /^(D|9|A)[a-zA-HJ-NP-Z0-9]{33}$/.test(address);
  }
}

