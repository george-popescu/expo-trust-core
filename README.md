# expo-trust-core

Multi-blockchain wallet SDK for React Native and Expo applications.

Built on [Trust Wallet Core](https://github.com/trustwallet/wallet-core) with comprehensive blockchain integration helpers.

[![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey.svg)]()

---

## Features

### Core Cryptography
- BIP39 Mnemonic generation (12/24 word phrases)
- HD Wallet support (BIP44/BIP84)
- Multi-chain address generation
- Message signing (EIP-191, Ed25519)
- EIP-712 Typed Data signing
- Multiple accounts per mnemonic

### Advanced Features
- Private key export and import
- Public key export
- Single-key wallet mode

### Blockchain Integration Helpers

**EVM Chains** (Ethereum, Polygon, Arbitrum, BSC, Base, Optimism, Avalanche)
- Balance checking
- ERC20 token support
- Transaction builder with gas estimation
- EIP-1559 support
- Full transaction signing

**Solana**
- SOL balance checking
- SPL token support
- Transaction builder
- Full transaction signing (including Jupiter/Raydium swap support)

**Bitcoin**
- Balance checking via multiple APIs
- UTXO management
- Transaction builder with fee calculation
- SegWit support

**Dogecoin**
- Balance checking
- UTXO management
- Transaction builder

---

## Installation

### 1. Install SDK

```bash
npm install expo-trust-core
```

or

```bash
yarn add expo-trust-core
```

### 2. Install Required Dependencies

The SDK requires these peer dependencies:

```bash
npm install ethers@^6.13.0 @solana/web3.js@^1.95.0
```

### 3. Install Solana Polyfills (Required)

For Solana support, install these polyfills:

```bash
npm install react-native-get-random-values fast-text-encoding buffer
```

### 4. Configure Polyfills

Add to your app entry point (`App.tsx` or `app/_layout.tsx`) **before any other imports**:

```typescript
import 'react-native-get-random-values';
import 'fast-text-encoding';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Now your other imports
import { App } from './App';
```

**Why polyfills?** The `@solana/web3.js` library requires Node.js crypto APIs (`crypto.getRandomValues`, `TextEncoder`) that are not available in React Native by default.

### 5. Platform-Specific Setup

**iOS:**
```bash
cd ios && pod install && cd ..
```

**Android:**
No additional setup required.

### Complete Dependency List

```json
{
  "dependencies": {
    "expo-trust-core": "^0.4.0",
    "ethers": "^6.13.0",
    "@solana/web3.js": "^1.95.0",
    "react-native-get-random-values": "^1.11.0",
    "fast-text-encoding": "^1.0.6",
    "buffer": "^6.0.3"
  }
}

---

## Quick Start

### Generate Wallet

```typescript
import { Mnemonic, HDWallet } from 'expo-trust-core';

// Generate 12-word mnemonic
const mnemonic = await Mnemonic.generate(128); // 128 bits = 12 words

// Create HD wallet
const wallet = new HDWallet(mnemonic);
```

### Generate Addresses

```typescript
import { Address, CoinType } from 'expo-trust-core';

// Bitcoin address (account 0)
const btcAddress = await Address.generate(mnemonic, CoinType.Bitcoin, 0);

// Ethereum address (works for all EVM chains)
const ethAddress = await Address.generate(mnemonic, CoinType.Ethereum, 0);

// Solana address
const solAddress = await Address.generate(mnemonic, CoinType.Solana, 0);

// Dogecoin address
const dogeAddress = await Address.generate(mnemonic, CoinType.Dogecoin, 0);

// Multiple accounts from same mnemonic
const ethAccount1 = await Address.generate(mnemonic, CoinType.Ethereum, 1);
const ethAccount2 = await Address.generate(mnemonic, CoinType.Ethereum, 2);
```

### Sign Messages

```typescript
import { Message, CoinType } from 'expo-trust-core';

// Ethereum Personal Sign (EIP-191)
const signature = await Message.signEthereumMessage(
  mnemonic,
  'Sign in to OpenSea',
  0 // account index
);

// Solana Message Sign
const solSignature = await Message.signSolanaMessage(
  mnemonic,
  'Sign in to Magic Eden',
  0
);
```

### Sign Typed Data (EIP-712)

```typescript
import { TypedData, CoinType } from 'expo-trust-core';

const typedData = {
  domain: {
    name: 'MyDApp',
    version: '1',
    chainId: 1,
    verifyingContract: '0x...',
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
  },
  primaryType: 'Person',
  message: {
    name: 'Alice',
    wallet: '0x...',
  },
};

const signature = await TypedData.sign(mnemonic, typedData, CoinType.Ethereum, 0);
```

---

## Blockchain Integration

### Check EVM Balance

```typescript
import { BalanceChecker } from 'expo-trust-core';

const myRpcUrl = 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY';
const result = await BalanceChecker.checkEVM(address, myRpcUrl, 18);
console.log(`Balance: ${result.balance} ETH`);

// Works with ANY EVM chain
const maticBalance = await BalanceChecker.checkEVM(
  address,
  'https://polygon-rpc.com',
  18
);
```

### Check ERC20 Token Balance

```typescript
import { TokenChecker } from 'expo-trust-core';

const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const token = await TokenChecker.checkERC20(
  walletAddress,
  usdcAddress,
  myRpcUrl
);
console.log(`${token.balance} ${token.symbol}`);
```

### Build EVM Transaction

```typescript
import { TransactionBuilder } from 'expo-trust-core';

const unsignedTx = await TransactionBuilder.buildEVMTransaction(
  fromAddress,
  toAddress,
  '0.5', // 0.5 ETH
  myRpcUrl
);

// Now sign with your wallet
// Then broadcast using ethers.js or web3.js
```

### Check Solana Balance

```typescript
import { SolanaBalanceChecker } from 'expo-trust-core';

const solanaRpc = 'https://api.mainnet-beta.solana.com';
const balance = await SolanaBalanceChecker.checkSOL(address, solanaRpc);
console.log(`Balance: ${balance.balance} SOL`);
```

### Check SPL Token Balance

```typescript
import { SolanaSPLChecker } from 'expo-trust-core';

const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const token = await SolanaSPLChecker.checkSPL(
  walletAddress,
  usdcMint,
  solanaRpc
);
console.log(`${token.balance} USDC`);
```

### Bitcoin Support

```typescript
import { BitcoinBalanceChecker, BitcoinTransactionBuilder } from 'expo-trust-core';

// Check balance
const balance = await BitcoinBalanceChecker.checkBTC(
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  'mempool.space'
);
console.log(`Balance: ${balance.balance} BTC`);

// Build transaction
const unsignedTx = await BitcoinTransactionBuilder.buildBTCTransaction(
  fromAddress,
  {
    toAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    amount: 100000, // 0.001 BTC in satoshis
    feeRate: 10, // satoshis per byte
    apiProvider: 'mempool.space',
  }
);

// Sign with Transaction.sign()
// Then broadcast to Bitcoin network
```

### Dogecoin Support

```typescript
import { DogecoinBalanceChecker, DogecoinTransactionBuilder } from 'expo-trust-core';

// Check balance
const balance = await DogecoinBalanceChecker.checkDOGE(
  'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L',
  'blockchair.com'
);
console.log(`Balance: ${balance.balance} DOGE`);

// Build transaction
const unsignedTx = await DogecoinTransactionBuilder.buildDOGETransaction(
  fromAddress,
  {
    toAddress: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L',
    amount: 100000000, // 1 DOGE in koinu
    feeRate: 100000, // 0.001 DOGE per byte
    apiProvider: 'blockchair.com',
  }
);

// Sign with Transaction.sign()
// Then broadcast to Dogecoin network
```

### Sign Transactions

```typescript
import { Transaction, CoinType } from 'expo-trust-core';

// Ethereum transaction
const signedEthTx = await Transaction.sign(mnemonic, CoinType.Ethereum, {
  to: '0x...',
  value: '0x0de0b6b3a7640000', // 1 ETH in wei (hex)
  gasPrice: '0x04a817c800', // 20 gwei
  gasLimit: '0x5208', // 21000
  nonce: 0,
  chainId: 1, // Mainnet
  data: '0x',
});
// Broadcast with ethers.js: await provider.sendTransaction(signedEthTx);

// Bitcoin transaction
const signedBtcTx = await Transaction.sign(mnemonic, CoinType.Bitcoin, {
  utxos: unsignedTx.utxos,
  toAddress: unsignedTx.toAddress,
  amount: unsignedTx.amount,
  changeAddress: unsignedTx.changeAddress,
  byteFee: unsignedTx.byteFee,
});
// Broadcast to Bitcoin network using a Bitcoin RPC or API

// Solana transaction
const signedSolTx = await Transaction.sign(mnemonic, CoinType.Solana, {
  recentBlockhash: 'xxx',
  recipient: 'xxx',
  amount: '1000000000', // 1 SOL in lamports
});
// Broadcast with @solana/web3.js: await connection.sendRawTransaction(signedSolTx);
```

---

## React Hooks

```typescript
import { useWallet, useAddress, useMessageSign } from 'expo-trust-core';

function MyWalletComponent() {
  const { wallet, createWallet, importWallet } = useWallet();
  const { generateAddress, addresses } = useAddress();
  const { signMessage, signTypedData } = useMessageSign();

  const handleCreateWallet = async () => {
    const newWallet = await createWallet();
    console.log('Mnemonic:', newWallet.mnemonic);
  };

  const handleGetAddress = async () => {
    const address = await generateAddress(CoinType.Ethereum, 0);
    console.log('Address:', address);
  };

  return (
    <View>
      <Button title="Create Wallet" onPress={handleCreateWallet} />
      <Button title="Get Address" onPress={handleGetAddress} />
    </View>
  );
}
```

---

## Supported Blockchains

| Blockchain | Symbol | Coin Type | Address Type |
|-----------|--------|-----------|--------------|
| Bitcoin | BTC | 0 | SegWit (bc1...) |
| Ethereum | ETH | 60 | EVM (0x...) |
| Solana | SOL | 501 | Base58 |
| Dogecoin | DOGE | 3 | Legacy (D...) |
| Polygon | MATIC | 60 | EVM (0x...) |
| Arbitrum | ARB | 60 | EVM (0x...) |
| Base | BASE | 60 | EVM (0x...) |
| BSC | BNB | 60 | EVM (0x...) |
| Optimism | OP | 60 | EVM (0x...) |
| Avalanche | AVAX | 60 | EVM (0x...) |

> **Note:** All EVM chains use the same `CoinType.Ethereum` (60) for address derivation.

---

## Architecture

```
expo-trust-core/
├── Native Layer (Trust Wallet Core)
│   ├── iOS (Swift)
│   └── Android (Kotlin)
├── TypeScript SDK
│   ├── Core Modules (Mnemonic, HDWallet, Address)
│   ├── Signing (Message, TypedData)
│   ├── Advanced (PrivateKey, PublicKey)
│   └── Blockchain Helpers (P2)
└── React Hooks
```

**Key Principles:**
- **RPC Agnostic:** You control your infrastructure
- **No Hardcoded URLs:** All RPC endpoints are user-provided
- **Universal EVM Support:** Works with any EVM-compatible chain
- **Privacy First:** All cryptographic operations happen locally

---

## API Reference

### Core Classes
- `Mnemonic` - Generate & validate BIP39 mnemonics
- `HDWallet` - Hierarchical deterministic wallet
- `Address` - Multi-chain address generation
- `Message` - Message signing (EIP-191, Solana)
- `TypedData` - EIP-712 typed data signing
- `PrivateKey` - Private key operations
- `PublicKey` - Public key operations
- `SingleKeyWallet` - Import from private key

### Blockchain Helpers - EVM
- `BalanceChecker` - Native balance queries
- `TokenChecker` - ERC20 token operations
- `TransactionBuilder` - Transaction construction

### Blockchain Helpers - Solana
- `SolanaBalanceChecker` - SOL balance queries
- `SolanaSPLChecker` - SPL token operations
- `SolanaTransactionBuilder` - Transaction construction

---

## Security Best Practices

1. **Never expose mnemonics** - Store securely with `expo-secure-store`
2. **Never log private keys** - Even in development
3. **Validate all addresses** - Before sending transactions
4. **Use HTTPS RPC endpoints** - Protect data in transit
5. **Test on testnet first** - Before mainnet deployment

---

## Troubleshooting

### Error: crypto.getRandomValues() not supported

You need to add polyfills for Solana. See [Installation](#-installation) section.

### Error: Module not found

Make sure you've installed the package and restarted Metro bundler:
```bash
npm install
npx expo start --clear
```

### iOS Build Issues

```bash
cd ios
pod install
cd ..
npx expo run:ios
```

### Android Build Issues

```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

---

## Platform Requirements

- **iOS:** 13.0 or higher
- **Android:** API level 21 (Android 5.0) or higher
- **React Native:** 0.70 or higher
- **Expo:** SDK 49 or higher

---

## Performance

- Address Generation: ~50ms (native)
- Message Signing: ~100ms (native)
- Balance Check: 200-500ms (network dependent)
- Transaction Build: 300-800ms (network dependent)

---

## Links

- [Trust Wallet Core](https://github.com/trustwallet/wallet-core)
- [Expo Documentation](https://docs.expo.dev)
- [React Native](https://reactnative.dev)

---

## License

MIT License - See LICENSE file for details.

---

## Support

If you find this SDK helpful, consider supporting its development:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-yellow.svg)](https://buymeacoffee.com/georgepopescu)

---

## Author

George Popescu - [GitHub](https://github.com/george-popescu)

