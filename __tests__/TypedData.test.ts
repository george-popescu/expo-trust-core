/**
 * TypedData Module Tests
 */

import { TypedData, EIP712TypedData } from '../src/modules/TypedData';
import { CoinType } from '../src/modules/CoinType';
import { mockSignTypedData } from './__mocks__/expo';

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const MOCK_SIGNATURE = '0x' + 'a'.repeat(128) + '1b';

describe('TypedData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sign()', () => {
    it('should sign typed data object', async () => {
      mockSignTypedData.mockResolvedValue(MOCK_SIGNATURE);

      const typedData: EIP712TypedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'chainId', type: 'uint256' },
          ],
          Person: [
            { name: 'name', type: 'string' },
          ],
        },
        primaryType: 'Person',
        domain: { name: 'Test', chainId: 1 },
        message: { name: 'Alice' },
      };

      const signature = await TypedData.sign(TEST_MNEMONIC, typedData, 0);

      expect(mockSignTypedData).toHaveBeenCalledWith(
        TEST_MNEMONIC,
        JSON.stringify(typedData),
        CoinType.Ethereum,
        0
      );
      expect(signature).toBe(MOCK_SIGNATURE);
    });

    it('should use account index 0 by default', async () => {
      mockSignTypedData.mockResolvedValue(MOCK_SIGNATURE);

      const typedData: EIP712TypedData = {
        types: { EIP712Domain: [] },
        primaryType: 'Test',
        domain: {},
        message: {},
      };

      await TypedData.sign(TEST_MNEMONIC, typedData);

      expect(mockSignTypedData).toHaveBeenCalledWith(
        TEST_MNEMONIC,
        expect.any(String),
        CoinType.Ethereum,
        0
      );
    });
  });

  describe('createPermit()', () => {
    it('should create valid ERC-2612 Permit structure', () => {
      const permit = TypedData.createPermit(
        '0xOwner',
        '0xSpender',
        '1000000',
        0,
        1704067200,
        'USDC',
        '0xUSDC',
        1
      );

      expect(permit.primaryType).toBe('Permit');
      expect(permit.domain.name).toBe('USDC');
      expect(permit.domain.chainId).toBe(1);
      expect(permit.types.Permit).toHaveLength(5);
      expect(permit.message.owner).toBe('0xOwner');
      expect(permit.message.value).toBe('1000000');
    });

    it('should be signable after creation', async () => {
      mockSignTypedData.mockResolvedValue(MOCK_SIGNATURE);

      const permit = TypedData.createPermit(
        '0x1234',
        '0x5678',
        '100',
        0,
        9999999999,
        'Test',
        '0xToken',
        1
      );

      const signature = await TypedData.sign(TEST_MNEMONIC, permit, 0);

      expect(signature).toBe(MOCK_SIGNATURE);
    });
  });
});
