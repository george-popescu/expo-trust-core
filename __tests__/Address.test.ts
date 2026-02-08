/**
 * Address Module Tests
 */

import { Address } from '../src/modules/Address';
import { CoinType } from '../src/modules/CoinType';
import { mockGetAddress, mockValidateAddress } from './__mocks__/expo';

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

const TEST_ADDRESSES = {
  ethereum: '0x9858EfFD232B4033E47d90003D41EC34EcaEda94',
  bitcoin: 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu',
  solana: 'FR8xQfFDGepbMBffchLwXqGxFMZXKNgu5JwGe64VXjHY',
};

describe('Address', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generate()', () => {
    it('should generate Ethereum address', async () => {
      mockGetAddress.mockResolvedValue(TEST_ADDRESSES.ethereum);

      const address = await Address.generate(TEST_MNEMONIC, CoinType.Ethereum, 0);

      expect(mockGetAddress).toHaveBeenCalledWith(TEST_MNEMONIC, CoinType.Ethereum, 0);
      expect(address).toBe(TEST_ADDRESSES.ethereum);
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should generate Bitcoin SegWit address', async () => {
      mockGetAddress.mockResolvedValue(TEST_ADDRESSES.bitcoin);

      const address = await Address.generate(TEST_MNEMONIC, CoinType.Bitcoin, 0);

      expect(address).toBe(TEST_ADDRESSES.bitcoin);
    });

    it('should generate Solana address', async () => {
      mockGetAddress.mockResolvedValue(TEST_ADDRESSES.solana);

      const address = await Address.generate(TEST_MNEMONIC, CoinType.Solana, 0);

      expect(address).toBe(TEST_ADDRESSES.solana);
    });

    it('should use account index 0 by default', async () => {
      mockGetAddress.mockResolvedValue(TEST_ADDRESSES.ethereum);

      await Address.generate(TEST_MNEMONIC, CoinType.Ethereum);

      expect(mockGetAddress).toHaveBeenCalledWith(TEST_MNEMONIC, CoinType.Ethereum, 0);
    });
  });

  describe('validate()', () => {
    it('should validate correct address', async () => {
      mockValidateAddress.mockResolvedValue(true);

      const isValid = await Address.validate(TEST_ADDRESSES.ethereum, CoinType.Ethereum);

      expect(mockValidateAddress).toHaveBeenCalledWith(TEST_ADDRESSES.ethereum, CoinType.Ethereum);
      expect(isValid).toBe(true);
    });

    it('should reject invalid address', async () => {
      mockValidateAddress.mockResolvedValue(false);

      const isValid = await Address.validate('0xinvalid', CoinType.Ethereum);

      expect(isValid).toBe(false);
    });
  });

  describe('format()', () => {
    it('should format long address with ellipsis', () => {
      const formatted = Address.format(TEST_ADDRESSES.ethereum);

      expect(formatted).toBe('0x9858...da94');
    });

    it('should use custom start and end chars', () => {
      const formatted = Address.format(TEST_ADDRESSES.ethereum, 10, 8);

      expect(formatted).toBe('0x9858EfFD...EcaEda94');
    });

    it('should return full address if shorter than format length', () => {
      const shortAddr = '0x1234';
      const formatted = Address.format(shortAddr);

      expect(formatted).toBe(shortAddr);
    });
  });
});
