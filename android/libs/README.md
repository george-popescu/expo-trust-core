# Android Native Libraries

This folder contains all required native libraries for the SDK to work on Android.

## Included Files

### 1. `wallet-core.aar` (26MB)
**Version:** 4.4.1  
**Source:** https://github.com/trustwallet/wallet-core/releases/tag/4.4.1

Contains:
- Native `.so` libraries (arm64-v8a, armeabi-v7a, x86, x86_64)
- JNI bindings for Trust Wallet Core
- Core cryptography classes

### 2. `wallet-core-proto-4.4.1.jar`
**Version:** 4.4.1  
**Source:** https://maven.pkg.github.com/trustwallet/wallet-core

Contains:
- Protocol Buffers classes for transaction signing
- `Bitcoin`, `Ethereum`, `Solana`, `Common` proto messages
- Required for `signTransaction()` functionality

### 3. `wallet-core-4.4.1.pom`
**Version:** 4.4.1

Maven POM file listing dependencies (proto JAR).

## Why Committed to Git?

Unlike typical build artifacts, we include these files because:
- ✅ **Required dependencies** for SDK to work
- ✅ **Reasonable size** (~30MB total)
- ✅ **Simplifies setup** - no manual downloads needed
- ✅ **Version consistency** - ensures all users have same version
- ✅ **Offline builds** - no network required during development

## For Developers: Updating Versions

### Update AAR:
1. Download from: https://github.com/trustwallet/wallet-core/releases
2. Replace `wallet-core.aar` in this folder
3. Update version in this README

### Update Proto JAR:
1. Download from GitHub Packages (requires GitHub token with `read:packages`)
2. Replace `wallet-core-proto-X.X.X.jar`
3. Update `build.gradle` dependency version
4. Update version in this README

### Commit:
```bash
git add android/libs/
git commit -m "chore: update Trust Wallet Core to vX.X.X"
```

