import WalletCore from '../ExpoTrustCoreModule';

/**
 * Address utilities for blockchain addresses
 */
export class Address {
  /**
   * Generate an address from mnemonic for a specific coin
   * @param mnemonic - The mnemonic phrase
   * @param coinType - The coin type number
   * @param accountIndex - Optional account index (default: 0)
   */
  static async generate(
    mnemonic: string,
    coinType: number,
    accountIndex: number = 0
  ): Promise<string> {
    return await WalletCore.getAddress(mnemonic, coinType, accountIndex);
  }

  /**
   * Validate an address for a specific coin type
   */
  static async validate(
    address: string,
    coinType: number
  ): Promise<boolean> {
    return await WalletCore.validateAddress(address, coinType);
  }

  /**
   * Format an address for display (shortened version)
   */
  static format(address: string, startChars: number = 6, endChars: number = 4): string {
    if (address.length <= startChars + endChars) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }
}

