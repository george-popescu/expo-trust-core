/**
 * Custom error classes for Expo Trust Core
 */

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

export class ValidationError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TransactionError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

export class AddressError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'AddressError';
  }
}

export class MnemonicError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'MnemonicError';
  }
}

/**
 * Handle and format errors
 */
export function handleError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new WalletError(String(error));
}

