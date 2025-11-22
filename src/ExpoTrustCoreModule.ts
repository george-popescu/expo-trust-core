import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoTrustCoreModule extends NativeModule {
  generateMnemonic(strength: number): string;
  validateMnemonic(mnemonic: string): boolean;
  createWallet(mnemonic: string, passphrase: string): { mnemonic: string; seed: string };
  getAddress(mnemonic: string, coinType: number, accountIndex?: number): string;
  getAddresses(mnemonic: string, coinTypes: number[], accountIndex?: number): string[];
  validateAddress(address: string, coinType: number): boolean;
  signTransaction(mnemonic: string, coinType: number, input: string, accountIndex?: number): Promise<string>;
  signRawTransaction(mnemonic: string, txHash: string, coinType: number, accountIndex?: number): string;
  signMessage(mnemonic: string, message: string, coinType: number): string;
  signTypedData(mnemonic: string, typedDataJSON: string, coinType: number): string;
  getPrivateKey(mnemonic: string, coinType: number, accountIndex?: number): string;
  getPublicKey(mnemonic: string, coinType: number, accountIndex?: number): string;
  importFromPrivateKey(privateKey: string, coinType: number): { address: string; publicKey: string; coinType: number };
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoTrustCoreModule>('ExpoTrustCore');
