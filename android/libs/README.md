# Android Native Library

## Trust Wallet Core AAR

**Included:** ✅ `wallet-core.aar` is included in this repository

**Version:** 4.4.1  
**Size:** ~26MB  
**Source:** https://github.com/trustwallet/wallet-core/releases/tag/4.4.1

## Why included in git?

Unlike typical build artifacts, we include `wallet-core.aar` because:
- ✅ Required dependency for the SDK to work
- ✅ Only 26MB (reasonable for git)
- ✅ Simplifies setup for users (no manual download needed)
- ✅ Ensures version consistency

## For Developers

If you need to update to a newer version:

1. Download from: https://github.com/trustwallet/wallet-core/releases
2. Replace `wallet-core.aar` in this folder
3. Update version number in this README
4. Commit the new AAR

