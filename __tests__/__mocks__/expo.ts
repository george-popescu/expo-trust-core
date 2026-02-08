// Mock for expo module
export class NativeModule {}

// Shared mock functions
export const mockGenerateMnemonic = jest.fn();
export const mockValidateMnemonic = jest.fn();
export const mockCreateWallet = jest.fn();
export const mockGetAddress = jest.fn();
export const mockGetAddresses = jest.fn();
export const mockValidateAddress = jest.fn();
export const mockSignTransaction = jest.fn();
export const mockSignRawTransaction = jest.fn();
export const mockSignMessage = jest.fn();
export const mockSignTypedData = jest.fn();
export const mockGetPrivateKey = jest.fn();
export const mockGetPublicKey = jest.fn();
export const mockImportFromPrivateKey = jest.fn();

const mockModule = {
  generateMnemonic: mockGenerateMnemonic,
  validateMnemonic: mockValidateMnemonic,
  createWallet: mockCreateWallet,
  getAddress: mockGetAddress,
  getAddresses: mockGetAddresses,
  validateAddress: mockValidateAddress,
  signTransaction: mockSignTransaction,
  signRawTransaction: mockSignRawTransaction,
  signMessage: mockSignMessage,
  signTypedData: mockSignTypedData,
  getPrivateKey: mockGetPrivateKey,
  getPublicKey: mockGetPublicKey,
  importFromPrivateKey: mockImportFromPrivateKey,
};

export function requireNativeModule(_name: string) {
  return mockModule;
}
