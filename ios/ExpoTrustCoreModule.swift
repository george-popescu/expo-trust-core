import ExpoModulesCore
import WalletCore

public class ExpoTrustCoreModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoTrustCore")

    /**
     * Generate a new BIP39 mnemonic phrase
     */
    Function("generateMnemonic") { (strength: Int) -> String in
      guard let wallet = HDWallet(strength: Int32(strength), passphrase: "") else {
        throw NSError(domain: "ExpoTrustCore", code: 1, userInfo: [
          NSLocalizedDescriptionKey: "Failed to generate mnemonic"
        ])
      }
      return wallet.mnemonic
    }

    /**
     * Validate a mnemonic phrase
     */
    Function("validateMnemonic") { (mnemonic: String) -> Bool in
      return Mnemonic.isValid(mnemonic: mnemonic)
    }

    /**
     * Create a wallet from mnemonic
     */
    Function("createWallet") { (mnemonic: String, passphrase: String) -> [String: String] in
      guard let wallet = HDWallet(mnemonic: mnemonic, passphrase: passphrase) else {
        throw NSError(domain: "ExpoTrustCore", code: 2, userInfo: [
          NSLocalizedDescriptionKey: "Failed to create wallet"
        ])
      }
      return [
        "mnemonic": wallet.mnemonic,
        "seed": wallet.seed.hexString
      ]
    }

    /**
     * Get address for a specific coin type with optional account index
     */
    Function("getAddress") { (mnemonic: String, coinType: Int, accountIndex: Int?) -> String in
      let accIndex = accountIndex ?? 0
      
      guard let wallet = HDWallet(mnemonic: mnemonic, passphrase: "") else {
        throw NSError(domain: "ExpoTrustCore", code: 3, userInfo: [
          NSLocalizedDescriptionKey: "Failed to create HDWallet"
        ])
      }
      
      let coinTypeValue = UInt32(exactly: coinType) ?? 0
      guard let coin = CoinType(rawValue: coinTypeValue) else {
        throw NSError(domain: "ExpoTrustCore", code: 3, userInfo: [
          NSLocalizedDescriptionKey: "Invalid coin type"
        ])
      }
      
      // Build derivation path based on coin type and account index
      let derivationPath: String
      switch coin {
      case .bitcoin:
        derivationPath = "m/84'/0'/\(accIndex)'/0/0" // Native SegWit
      case .ethereum:
        derivationPath = "m/44'/60'/\(accIndex)'/0/0"
      case .solana:
        derivationPath = "m/44'/501'/\(accIndex)'/0'"
      case .dogecoin:
        derivationPath = "m/44'/3'/\(accIndex)'/0/0"
      default:
        derivationPath = "m/44'/\(coin.rawValue)/\(accIndex)'/0/0"
      }
      
      // For account 0, use default method
      if accIndex == 0 {
        return wallet.getAddressForCoin(coin: coin)
      }
      
      // For other accounts, derive manually using private key
      let privateKey = wallet.getKey(coin: coin, derivationPath: derivationPath)
      return coin.deriveAddress(privateKey: privateKey)
    }

    /**
     * Get addresses for multiple coin types with optional account index
     */
    Function("getAddresses") { (mnemonic: String, coinTypes: [Int], accountIndex: Int?) -> [String] in
      let accIndex = accountIndex ?? 0
      
      guard let wallet = HDWallet(mnemonic: mnemonic, passphrase: "") else {
        throw NSError(domain: "ExpoTrustCore", code: 4, userInfo: [
          NSLocalizedDescriptionKey: "Failed to get addresses"
        ])
      }
      
      return coinTypes.compactMap { coinTypeValue in
        guard let coin = CoinType(rawValue: UInt32(exactly: coinTypeValue) ?? 0) else {
          return nil
        }
        
        // For account 0, use default
        if accIndex == 0 {
          return wallet.getAddressForCoin(coin: coin)
        }
        
        // For other accounts, derive with custom path
        let derivationPath: String
        switch coin {
        case .bitcoin:
          derivationPath = "m/84'/0'/\(accIndex)'/0/0"
        case .ethereum:
          derivationPath = "m/44'/60'/\(accIndex)'/0/0"
        case .solana:
          derivationPath = "m/44'/501'/\(accIndex)'/0'"
        case .dogecoin:
          derivationPath = "m/44'/3'/\(accIndex)'/0/0"
        default:
          derivationPath = "m/44'/\(coin.rawValue)/\(accIndex)'/0/0"
        }
        
        let privateKey = wallet.getKey(coin: coin, derivationPath: derivationPath)
        return coin.deriveAddress(privateKey: privateKey)
      }
    }

    /**
     * Validate an address for a specific coin type
     */
    Function("validateAddress") { (address: String, coinType: Int) -> Bool in
      guard let coin = CoinType(rawValue: UInt32(exactly: coinType) ?? 0) else {
        return false
      }
      return coin.validate(address: address)
    }

    /**
     * Sign a transaction
     */
    AsyncFunction("signTransaction") { (mnemonic: String, coinType: Int, input: String, accountIndex: Int?) -> String in
      guard let wallet = HDWallet(mnemonic: mnemonic, passphrase: "") else {
        throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
          NSLocalizedDescriptionKey: "Failed to create wallet"
        ])
      }
      
      guard let coin = CoinType(rawValue: UInt32(exactly: coinType) ?? 0) else {
        throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
          NSLocalizedDescriptionKey: "Invalid coin type"
        ])
      }
      
      // Parse JSON input
      guard let inputData = input.data(using: .utf8),
            let inputJSON = try? JSONSerialization.jsonObject(with: inputData) as? [String: Any] else {
        throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
          NSLocalizedDescriptionKey: "Invalid input JSON"
        ])
      }
      
      let accIndex = accountIndex ?? 0
      
      // Route to appropriate signing method based on coin type
      switch coin {
      case .ethereum:
        return try self.signEthereumTransaction(wallet: wallet, inputJSON: inputJSON, accountIndex: accIndex)
      
      case .solana:
        return try self.signSolanaTransaction(wallet: wallet, inputJSON: inputJSON, accountIndex: accIndex)
      
      case .bitcoin, .dogecoin:
        return try self.signBitcoinTransaction(wallet: wallet, coin: coin, inputJSON: inputJSON, accountIndex: accIndex)
      
      default:
        throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
          NSLocalizedDescriptionKey: "Transaction signing not yet implemented for \(coin)"
        ])
      }
    }

    /**
     * Sign a message (personal_sign for Ethereum, raw sign for Solana)
     */
    Function("signMessage") { (mnemonic: String, message: String, coinType: Int, accountIndex: Int?) -> String in
      guard let wallet = HDWallet(mnemonic: mnemonic, passphrase: "") else {
        throw NSError(domain: "ExpoTrustCore", code: 6, userInfo: [
          NSLocalizedDescriptionKey: "Failed to create wallet"
        ])
      }
      
      guard let coin = CoinType(rawValue: UInt32(exactly: coinType) ?? 0) else {
        throw NSError(domain: "ExpoTrustCore", code: 6, userInfo: [
          NSLocalizedDescriptionKey: "Invalid coin type"
        ])
      }
      
      let index = accountIndex ?? 0
      let messageData = Data(message.utf8)
      
      switch coin {
      case .ethereum:
        // Ethereum personal_sign (EIP-191): "\x19Ethereum Signed Message:\n" + len(message) + message
        let prefix = "\u{19}Ethereum Signed Message:\n\(messageData.count)"
        let prefixedMessage = Data(prefix.utf8) + messageData
        let hash = Hash.keccak256(data: prefixedMessage)
        
        let privateKey = wallet.getKey(coin: coin, derivationPath: "m/44'/60'/0'/0/\(index)")
        let signature = privateKey.sign(digest: hash, curve: .secp256k1)!
        
        return signature.hexString
        
      case .solana:
        let privateKey = wallet.getKey(coin: coin, derivationPath: "m/44'/501'/\(index)'/0'")
        let signature = privateKey.sign(digest: messageData, curve: .ed25519)!
        
        return signature.hexString
        
      default:
        throw NSError(domain: "ExpoTrustCore", code: 6, userInfo: [
          NSLocalizedDescriptionKey: "Message signing not supported for this chain"
        ])
      }
    }

    /**
     * Sign EIP-712 typed data (Ethereum only)
     */
    Function("signTypedData") { (mnemonic: String, typedDataJSON: String, coinType: Int, accountIndex: Int?) -> String in
      // Only Ethereum supports EIP-712
      guard coinType == CoinType.ethereum.rawValue else {
        throw NSError(domain: "ExpoTrustCore", code: 7, userInfo: [
          NSLocalizedDescriptionKey: "EIP-712 signing only supported for Ethereum"
        ])
      }
      
      guard let wallet = HDWallet(mnemonic: mnemonic, passphrase: "") else {
        throw NSError(domain: "ExpoTrustCore", code: 7, userInfo: [
          NSLocalizedDescriptionKey: "Failed to create wallet"
        ])
      }
      
      let index = accountIndex ?? 0
      
      // Parse typed data JSON
      guard let jsonData = typedDataJSON.data(using: .utf8),
            let typedData = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
        throw NSError(domain: "ExpoTrustCore", code: 7, userInfo: [
          NSLocalizedDescriptionKey: "Invalid EIP-712 JSON"
        ])
      }
      
      // Encode EIP-712 data to hash (EIP-712 compliant)
      let hash = try EIP712Encoder.encodeAndHash(typedData: typedData)
      
      // Sign the hash
      let privateKey = wallet.getKey(coin: .ethereum, derivationPath: "m/44'/60'/0'/0/\(index)")
      let signature = privateKey.sign(digest: hash, curve: .secp256k1)!
      
      return signature.hexString
    }

    /**
     * Export private key for a specific coin and account
     * ⚠️ SECURITY: Handle with extreme care!
     */
    Function("getPrivateKey") { (mnemonic: String, coinType: Int, accountIndex: Int?) -> String in
      let accIndex = accountIndex ?? 0
      
      guard let wallet = HDWallet(mnemonic: mnemonic, passphrase: ""),
            let coin = CoinType(rawValue: UInt32(exactly: coinType) ?? 0) else {
        throw NSError(domain: "ExpoTrustCore", code: 8, userInfo: [
          NSLocalizedDescriptionKey: "Failed to get private key"
        ])
      }
      
      // Build derivation path
      let derivationPath: String
      switch coin {
      case .bitcoin:
        derivationPath = "m/84'/0'/\(accIndex)'/0/0"
      case .ethereum:
        derivationPath = "m/44'/60'/\(accIndex)'/0/0"
      case .solana:
        derivationPath = "m/44'/501'/\(accIndex)'/0'"
      case .dogecoin:
        derivationPath = "m/44'/3'/\(accIndex)'/0/0"
      default:
        derivationPath = "m/44'/\(coin.rawValue)/\(accIndex)'/0/0"
      }
      
      let privateKey = wallet.getKey(coin: coin, derivationPath: derivationPath)
      return privateKey.data.hexString
    }

    /**
     * Export public key for a specific coin and account
     */
    Function("getPublicKey") { (mnemonic: String, coinType: Int, accountIndex: Int?) -> String in
      let accIndex = accountIndex ?? 0
      
      guard let wallet = HDWallet(mnemonic: mnemonic, passphrase: ""),
            let coin = CoinType(rawValue: UInt32(exactly: coinType) ?? 0) else {
        throw NSError(domain: "ExpoTrustCore", code: 9, userInfo: [
          NSLocalizedDescriptionKey: "Failed to get public key"
        ])
      }
      
      // Build derivation path
      let derivationPath: String
      switch coin {
      case .bitcoin:
        derivationPath = "m/84'/0'/\(accIndex)'/0/0"
      case .ethereum:
        derivationPath = "m/44'/60'/\(accIndex)'/0/0"
      case .solana:
        derivationPath = "m/44'/501'/\(accIndex)'/0'"
      case .dogecoin:
        derivationPath = "m/44'/3'/\(accIndex)'/0/0"
      default:
        derivationPath = "m/44'/\(coin.rawValue)/\(accIndex)'/0/0"
      }
      
      let privateKey = wallet.getKey(coin: coin, derivationPath: derivationPath)
      let publicKey = privateKey.getPublicKeySecp256k1(compressed: true)
      return publicKey.data.hexString
    }

    /**
     * Import wallet from private key (single chain only)
     */
    Function("importFromPrivateKey") { (privateKeyHex: String, coinType: Int) -> [String: Any] in
      guard let coin = CoinType(rawValue: UInt32(exactly: coinType) ?? 0) else {
        throw NSError(domain: "ExpoTrustCore", code: 10, userInfo: [
          NSLocalizedDescriptionKey: "Invalid coin type"
        ])
      }
      
      guard let keyData = Data(hexString: privateKeyHex) else {
        throw NSError(domain: "ExpoTrustCore", code: 10, userInfo: [
          NSLocalizedDescriptionKey: "Invalid private key format"
        ])
      }
      
      guard let privateKey = PrivateKey(data: keyData) else {
        throw NSError(domain: "ExpoTrustCore", code: 10, userInfo: [
          NSLocalizedDescriptionKey: "Failed to create private key"
        ])
      }
      
      let address = coin.deriveAddress(privateKey: privateKey)
      let publicKey = privateKey.getPublicKeySecp256k1(compressed: true)
      
      return [
        "address": address,
        "publicKey": publicKey.data.hexString,
        "coinType": coinType
      ]
    }

    /**
     * Sign raw transaction hash (advanced - for custom transaction building)
     */
    Function("signRawTransaction") { (mnemonic: String, txHash: String, coinType: Int, accountIndex: Int?) -> String in
      let accIndex = accountIndex ?? 0
      
      guard let wallet = HDWallet(mnemonic: mnemonic, passphrase: ""),
            let coin = CoinType(rawValue: UInt32(exactly: coinType) ?? 0) else {
        throw NSError(domain: "ExpoTrustCore", code: 11, userInfo: [
          NSLocalizedDescriptionKey: "Failed to create wallet"
        ])
      }
      
      guard let hashData = Data(hexString: txHash.hasPrefix("0x") ? String(txHash.dropFirst(2)) : txHash) else {
        throw NSError(domain: "ExpoTrustCore", code: 11, userInfo: [
          NSLocalizedDescriptionKey: "Invalid transaction hash format"
        ])
      }
      
      // Build derivation path
      let derivationPath: String
      switch coin {
      case .bitcoin:
        derivationPath = "m/84'/0'/\(accIndex)'/0/0"
      case .ethereum:
        derivationPath = "m/44'/60'/\(accIndex)'/0/0"
      case .solana:
        derivationPath = "m/44'/501'/\(accIndex)'/0'"
      case .dogecoin:
        derivationPath = "m/44'/3'/\(accIndex)'/0/0"
      default:
        derivationPath = "m/44'/\(coin.rawValue)/\(accIndex)'/0/0"
      }
      
      let privateKey = wallet.getKey(coin: coin, derivationPath: derivationPath)
      let signature = privateKey.sign(digest: hashData, curve: .secp256k1)!
      
      return signature.hexString
    }
  }
  
  // MARK: - Transaction Signing Helpers
  
  /**
   * Sign Ethereum transaction using Protocol Buffers
   */
  private func signEthereumTransaction(wallet: HDWallet, inputJSON: [String: Any], accountIndex: Int) throws -> String {
    let coin = CoinType.ethereum
    let derivationPath = "m/44'/60'/\(accountIndex)'/0/0"
    let privateKey = wallet.getKey(coin: coin, derivationPath: derivationPath)
    
    // Parse input parameters
    guard let toAddress = inputJSON["to"] as? String else {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Missing 'to' address"
      ])
    }
    
    guard let value = inputJSON["value"] as? String else {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Missing 'value'"
      ])
    }
    
    let gasPrice = inputJSON["gasPrice"] as? String ?? "20000000000"  // 20 gwei default
    let gasLimit = inputJSON["gasLimit"] as? String ?? "21000"
    let nonce = inputJSON["nonce"] as? Int ?? 0
    let chainId = inputJSON["chainId"] as? Int ?? 1  // Mainnet default
    let data = inputJSON["data"] as? String ?? "0x"
    
    // Check if EIP-1559 transaction
    let maxFeePerGas = inputJSON["maxFeePerGas"] as? String
    let maxPriorityFeePerGas = inputJSON["maxPriorityFeePerGas"] as? String
    let isEIP1559 = maxFeePerGas != nil && maxPriorityFeePerGas != nil
    
    // Convert hex strings to Data
    guard let valueData = Data(hexString: value.hasPrefix("0x") ? String(value.dropFirst(2)) : value) else {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Invalid value format"
      ])
    }
    
    guard let gasPriceData = Data(hexString: gasPrice.hasPrefix("0x") ? String(gasPrice.dropFirst(2)) : gasPrice) else {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Invalid gasPrice format"
      ])
    }
    
    guard let gasLimitData = Data(hexString: gasLimit.hasPrefix("0x") ? String(gasLimit.dropFirst(2)) : gasLimit) else {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Invalid gasLimit format"
      ])
    }
    
    let chainIdData = Data(hexString: String(format: "%02x", chainId))!
    let nonceData = Data(hexString: String(format: "%02x", nonce))!
    let dataBytes = Data(hexString: data.hasPrefix("0x") ? String(data.dropFirst(2)) : data) ?? Data()
    
    // Build Ethereum SigningInput
    let signingInput = try EthereumSigningInput.with {
      $0.chainID = chainIdData
      $0.nonce = nonceData
      $0.gasLimit = gasLimitData
      $0.toAddress = toAddress
      $0.privateKey = privateKey.data
      
      if isEIP1559, let maxFee = maxFeePerGas, let maxPriority = maxPriorityFeePerGas {
        // EIP-1559 transaction
        $0.txMode = .enveloped
        guard let maxFeeData = Data(hexString: maxFee.hasPrefix("0x") ? String(maxFee.dropFirst(2)) : maxFee),
              let maxPriorityData = Data(hexString: maxPriority.hasPrefix("0x") ? String(maxPriority.dropFirst(2)) : maxPriority) else {
          throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
            NSLocalizedDescriptionKey: "Invalid EIP-1559 fee format"
          ])
        }
        $0.maxFeePerGas = maxFeeData
        $0.maxInclusionFeePerGas = maxPriorityData
      } else {
        // Legacy transaction
        $0.txMode = .legacy
        $0.gasPrice = gasPriceData
      }
      
      // Set transaction type
      $0.transaction = try EthereumTransaction.with {
        $0.transfer = try EthereumTransaction.Transfer.with {
          $0.amount = valueData
          $0.data = dataBytes
        }
      }
    }
    
    // Sign transaction
    let output: EthereumSigningOutput = AnySigner.sign(input: signingInput, coin: coin)
    
    if output.error != .ok {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Signing failed: \(output.errorMessage)"
      ])
    }
    
    // Return hex-encoded signed transaction
    return "0x" + output.encoded.hexString
  }
  
  /**
   * Sign Solana transaction using Protocol Buffers
   */
  private func signSolanaTransaction(wallet: HDWallet, inputJSON: [String: Any], accountIndex: Int) throws -> String {
    let coin = CoinType.solana
    let derivationPath = "m/44'/501'/\(accountIndex)'/0'"
    let privateKey = wallet.getKey(coin: coin, derivationPath: derivationPath)
    let senderAddress = coin.deriveAddress(privateKey: privateKey)
    
    // Parse input parameters
    guard let recentBlockhash = inputJSON["recentBlockhash"] as? String else {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Missing 'recentBlockhash'"
      ])
    }
    
    guard let recipient = inputJSON["recipient"] as? String,
          let amount = inputJSON["amount"] as? String else {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Missing 'recipient' or 'amount' for transfer"
      ])
    }
    
    guard let lamports = UInt64(amount) else {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Invalid amount format"
      ])
    }
    
    let signingInput = try SolanaSigningInput.with {
      $0.privateKey = privateKey.data
      $0.recentBlockhash = recentBlockhash
      $0.sender = senderAddress
      $0.transferTransaction = try SolanaTransfer.with {
        $0.recipient = recipient
        $0.value = lamports
      }
      $0.txEncoding = .base64
    }
    
    let output: SolanaSigningOutput = AnySigner.sign(input: signingInput, coin: coin)
    
    if output.error != .ok {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Signing failed: \(output.errorMessage)"
      ])
    }
    
    return output.encoded
  }
  
  /**
   * Sign Bitcoin/Dogecoin transaction using Protocol Buffers
   */
  private func signBitcoinTransaction(wallet: HDWallet, coin: CoinType, inputJSON: [String: Any], accountIndex: Int) throws -> String {
    // Derive private key
    let derivationPath: String
    switch coin {
    case .bitcoin:
      derivationPath = "m/84'/0'/\(accountIndex)'/0/0"  // Native SegWit
    case .dogecoin:
      derivationPath = "m/44'/3'/\(accountIndex)'/0/0"
    default:
      derivationPath = "m/44'/\(coin.rawValue)/\(accountIndex)'/0/0"
    }
    
    let privateKey = wallet.getKey(coin: coin, derivationPath: derivationPath)
    let fromAddress = coin.deriveAddress(privateKey: privateKey)
    
    // Parse input parameters
    guard let utxosArray = inputJSON["utxos"] as? [[String: Any]] else {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Missing 'utxos' array"
      ])
    }
    
    guard let toAddress = inputJSON["toAddress"] as? String else {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Missing 'toAddress'"
      ])
    }
    
    guard let amount = inputJSON["amount"] as? Int64 else {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Missing or invalid 'amount'"
      ])
    }
    
    let byteFee = inputJSON["byteFee"] as? Int64 ?? 1
    let changeAddress = inputJSON["changeAddress"] as? String ?? fromAddress
    
    // Build UTXOs
    var utxos: [BitcoinUnspentTransaction] = []
    for utxoJSON in utxosArray {
      guard let txid = utxoJSON["txid"] as? String,
            let vout = utxoJSON["vout"] as? UInt32,
            let value = utxoJSON["value"] as? Int64,
            let scriptPubKey = utxoJSON["scriptPubKey"] as? String else {
        continue
      }
      
      guard let txidData = Data(hexString: txid) else { continue }
      guard let scriptData = Data(hexString: scriptPubKey.hasPrefix("0x") ? String(scriptPubKey.dropFirst(2)) : scriptPubKey) else { continue }
      
      let utxo = try BitcoinUnspentTransaction.with {
        $0.outPoint = try BitcoinOutPoint.with {
          $0.hash = Data(txidData.reversed())  // Bitcoin uses reversed hash
          $0.index = vout
          $0.sequence = UInt32.max
        }
        $0.amount = value
        $0.script = scriptData
      }
      
      utxos.append(utxo)
    }
    
    guard !utxos.isEmpty else {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "No valid UTXOs provided"
      ])
    }
    
    // Build signing input
    let signingInput = try BitcoinSigningInput.with {
      $0.hashType = BitcoinSigHashType.all.rawValue
      $0.amount = amount
      $0.byteFee = byteFee
      $0.toAddress = toAddress
      $0.changeAddress = changeAddress
      $0.privateKey = [privateKey.data]
      $0.utxo = utxos
    }
    
    // Sign transaction
    let output: BitcoinSigningOutput = AnySigner.sign(input: signingInput, coin: coin)
    
    if output.error != .ok {
      throw NSError(domain: "ExpoTrustCore", code: 5, userInfo: [
        NSLocalizedDescriptionKey: "Signing failed: \(output.errorMessage)"
      ])
    }
    
    // Return hex-encoded signed transaction
    return output.encoded.hexString
  }
}
