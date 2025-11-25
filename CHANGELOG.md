# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-25

### Added
- ✅ **HD Account Index support for message signing:**
  - `Message.signEthereumMessage()` now accepts optional `accountIndex` parameter
  - `Message.signSolanaMessage()` now accepts optional `accountIndex` parameter
  - `signMessage()` native function updated in Swift (iOS) and Kotlin (Android) to use account-specific derivation paths
  - `signTypedData()` native function updated to support multi-account signing
  - Backwards compatible: defaults to account 0 if not specified

### Fixed
- Fixed hardcoded account index (0) in message/typed data signing - now supports any HD account
- Updated derivation paths to properly use accountIndex:
  - Ethereum: `m/44'/60'/0'/0/{accountIndex}`
  - Solana: `m/44'/501'/{accountIndex}'/0'`

## [1.0.0] - 2024-11-22

### 🎉 First Stable Release - Production Ready!

This is the first production-ready release of expo-trust-core with complete iOS/Android parity and native transaction signing support.

### Added

#### Native Transaction Signing (MAJOR)
- ✅ **Full Protobuf transaction signing** on iOS & Android
- ✅ **Ethereum signing:** Legacy + EIP-1559 support
- ✅ **Solana signing:** SOL transfers with Protocol Buffers
- ✅ **Bitcoin signing:** SegWit UTXO-based transactions
- ✅ **`signRawTransaction()`:** Advanced signing for custom workflows
- ✅ **100% API parity** between iOS and Android (13 identical functions)
- ✅ **Private keys NEVER exposed to JavaScript** - all signing happens in native code

#### Core Features (Carried from 0.4.x)
- ✅ BIP39 mnemonic generation & validation
- ✅ BIP44/BIP84 HD wallet derivation
- ✅ Multi-chain address generation (Bitcoin, Ethereum, Solana, Dogecoin)
- ✅ Multiple accounts support (0-∞)
- ✅ Message signing (EIP-191 for Ethereum, Ed25519 for Solana)
- ✅ EIP-712 typed data signing (production-grade encoder)
- ✅ Private key export & import
- ✅ Public key export

#### Blockchain Integration Helpers (P2)
- ✅ BalanceChecker - Native coin balances on EVM chains
- ✅ TokenChecker - ERC20 token support
- ✅ TransactionBuilder - Unsigned transaction helpers with gas estimation
- ✅ RPC-agnostic architecture (users provide their own RPC URLs)

#### Documentation
- ✅ Complete API reference for all 13 native functions
- ✅ Native transaction signing examples
- ✅ Android setup guide (AAR + proto JAR)
- ✅ Advanced signing workflows documentation

### Changed

- **Package version:** 0.4.2 → 1.0.0
- **Description:** Updated to reflect production-ready status with native signing
- **README:** Complete overhaul with v1.0 features
- **Android dependencies:** Added `wallet-core-proto-4.4.1.jar` for Protobuf support
- **Import structure:** Fixed `AnySigner` import (`wallet.core.java.AnySigner` on Android)

### Technical Details

#### iOS
- Uses TrustWalletCore 4.3.15 via CocoaPods
- Complete Protobuf support included
- All 13 functions implemented with Protocol Buffers

#### Android
- Uses wallet-core.aar 4.4.1 (26MB - committed to git)
- Uses wallet-core-proto-4.4.1.jar (Protobuf classes - committed to git)
- Uses protobuf-javalite:3.25.1 (runtime)
- All 13 functions implemented with Protocol Buffers

#### API Parity Achievement
All functions have identical signatures and behavior on both platforms:
1. `generateMnemonic`
2. `validateMnemonic`
3. `createWallet`
4. `getAddress`
5. `getAddresses`
6. `validateAddress`
7. `signTransaction` (AsyncFunction)
8. `signMessage`
9. `signTypedData`
10. `getPrivateKey`
11. `getPublicKey`
12. `importFromPrivateKey`
13. `signRawTransaction` (NEW in v1.0)

### Dependencies

```json
{
  "peerDependencies": {
    "ethers": "^6.13.0",
    "@solana/web3.js": "^1.95.0",
    "react-native-get-random-values": ">=1.11.0",
    "fast-text-encoding": ">=1.0.6",
    "buffer": ">=6.0.3"
  }
}
```

### Breaking Changes

**NONE** - This release is fully backward compatible with 0.4.x!

All existing APIs remain unchanged. New features are purely additive.

### Migration from 0.4.x

No migration needed! Simply update your `package.json`:

```bash
npm install expo-trust-core@^1.0.0
# or
yarn add expo-trust-core@^1.0.0
```

All existing code will continue to work without modifications.

### What's Next

Future releases will focus on:
- Additional blockchain support (Cosmos, Polkadot, etc.)
- Advanced DeFi helpers (DEX swaps, staking)
- Hardware wallet integration
- Multi-signature support

---

## [0.4.2] - 2024-11-20

### Added
- Message signing (EIP-191, Solana)
- EIP-712 typed data signing
- Multiple accounts support
- Private/Public key export
- Import from private key

### Changed
- Updated documentation
- Improved error handling

---

## [0.4.0] - 2024-11-15

### Added
- Initial release
- BIP39 mnemonic support
- HD wallet derivation
- Multi-chain address generation
- React hooks

---

[1.0.0]: https://github.com/george-popescu/trust-wallet-sdk/compare/v0.4.2...v1.0.0
[0.4.2]: https://github.com/george-popescu/trust-wallet-sdk/compare/v0.4.0...v0.4.2
[0.4.0]: https://github.com/george-popescu/trust-wallet-sdk/releases/tag/v0.4.0

