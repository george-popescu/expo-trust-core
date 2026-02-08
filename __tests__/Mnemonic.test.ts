/**
 * Mnemonic Module Tests
 */

import { Mnemonic } from '../src/modules/Mnemonic';
import { mockGenerateMnemonic, mockValidateMnemonic } from './__mocks__/expo';

const TEST_MNEMONICS = {
  valid12: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  valid24: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
  invalid: 'invalid mnemonic phrase that should not validate',
};

describe('Mnemonic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generate()', () => {
    it('should generate 12-word mnemonic with default strength', async () => {
      mockGenerateMnemonic.mockResolvedValue(TEST_MNEMONICS.valid12);

      const mnemonic = await Mnemonic.generate();

      expect(mockGenerateMnemonic).toHaveBeenCalledWith(128);
      expect(mnemonic).toBe(TEST_MNEMONICS.valid12);
      expect(mnemonic.split(' ')).toHaveLength(12);
    });

    it('should generate 24-word mnemonic with 256-bit strength', async () => {
      mockGenerateMnemonic.mockResolvedValue(TEST_MNEMONICS.valid24);

      const mnemonic = await Mnemonic.generate(256);

      expect(mockGenerateMnemonic).toHaveBeenCalledWith(256);
      expect(mnemonic.split(' ')).toHaveLength(24);
    });

    it('should throw for invalid strength values', async () => {
      await expect(Mnemonic.generate(100)).rejects.toThrow(
        'Invalid mnemonic strength. Must be 128, 160, 192, 224, or 256'
      );
    });

    it('should accept all valid strength values', async () => {
      mockGenerateMnemonic.mockResolvedValue('mock mnemonic');

      for (const strength of [128, 160, 192, 224, 256]) {
        await Mnemonic.generate(strength);
        expect(mockGenerateMnemonic).toHaveBeenCalledWith(strength);
      }
    });
  });

  describe('validate()', () => {
    it('should return true for valid mnemonic', async () => {
      mockValidateMnemonic.mockResolvedValue(true);

      const isValid = await Mnemonic.validate(TEST_MNEMONICS.valid12);

      expect(mockValidateMnemonic).toHaveBeenCalledWith(TEST_MNEMONICS.valid12);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid mnemonic', async () => {
      mockValidateMnemonic.mockResolvedValue(false);

      const isValid = await Mnemonic.validate(TEST_MNEMONICS.invalid);

      expect(isValid).toBe(false);
    });
  });

  describe('getWordCount()', () => {
    it('should return correct word count for each strength', () => {
      expect(Mnemonic.getWordCount(128)).toBe(12);
      expect(Mnemonic.getWordCount(160)).toBe(15);
      expect(Mnemonic.getWordCount(192)).toBe(18);
      expect(Mnemonic.getWordCount(224)).toBe(21);
      expect(Mnemonic.getWordCount(256)).toBe(24);
    });
  });

  describe('getStrength()', () => {
    it('should return correct strength for each word count', () => {
      expect(Mnemonic.getStrength(12)).toBe(128);
      expect(Mnemonic.getStrength(15)).toBe(160);
      expect(Mnemonic.getStrength(18)).toBe(192);
      expect(Mnemonic.getStrength(21)).toBe(224);
      expect(Mnemonic.getStrength(24)).toBe(256);
    });
  });
});
