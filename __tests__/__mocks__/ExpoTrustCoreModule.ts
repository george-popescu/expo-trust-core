// Mock for ExpoTrustCoreModule
export const mockGenerateMnemonic = jest.fn();
export const mockValidateMnemonic = jest.fn();
export const mockGetAddress = jest.fn();
export const mockGetAddresses = jest.fn();
export const mockValidateAddress = jest.fn();
export const mockSignTransaction = jest.fn();
export const mockSignMessage = jest.fn();
export const mockSignTypedData = jest.fn();
export const mockGetPrivateKey = jest.fn();
export const mockGetPublicKey = jest.fn();
export const mockImportFromPrivateKey = jest.fn();
export const mockSignRawTransaction = jest.fn();
export const mockCreateWallet = jest.fn();

export default {
  generateMnemonic: mockGenerateMnemonic,
  validateMnemonic: mockValidateMnemonic,
  getAddress: mockGetAddress,
  getAddresses: mockGetAddresses,
  validateAddress: mockValidateAddress,
  signTransaction: mockSignTransaction,
  signMessage: mockSignMessage,
  signTypedData: mockSignTypedData,
  getPrivateKey: mockGetPrivateKey,
  getPublicKey: mockGetPublicKey,
  importFromPrivateKey: mockImportFromPrivateKey,
  signRawTransaction: mockSignRawTransaction,
  createWallet: mockCreateWallet,
};
