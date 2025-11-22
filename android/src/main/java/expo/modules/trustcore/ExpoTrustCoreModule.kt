package expo.modules.trustcore

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import wallet.core.jni.HDWallet
import wallet.core.jni.CoinType
import wallet.core.jni.Mnemonic
import wallet.core.jni.Hash
import wallet.core.jni.Curve
import wallet.core.jni.PrivateKey
import wallet.core.java.AnySigner
import wallet.core.jni.BitcoinScript
import wallet.core.jni.proto.Bitcoin
import wallet.core.jni.proto.Ethereum
import wallet.core.jni.proto.Solana
import wallet.core.jni.proto.Common
import com.google.protobuf.ByteString

class ExpoTrustCoreModule : Module() {
  
  companion object {
    init {
      try {
        System.loadLibrary("TrustWalletCore")
      } catch (e: Exception) {
        // Critical error: native library failed to load
        // This should never happen in production if AAR is properly integrated
        throw RuntimeException("Failed to load TrustWalletCore native library", e)
      }
    }
  }
  
  // Helper: Get derivation path for coin type and account index
  private fun getDerivationPath(coin: CoinType, accountIndex: Int): String {
    return when (coin) {
      CoinType.BITCOIN -> "m/84'/0'/$accountIndex'/0/0"
      CoinType.ETHEREUM -> "m/44'/60'/$accountIndex'/0/0"
      CoinType.SOLANA -> "m/44'/501'/$accountIndex'/0'"
      CoinType.DOGECOIN -> "m/44'/3'/$accountIndex'/0/0"
      else -> "m/44'/${coin.value()}/$accountIndex'/0/0"
    }
  }
  
  override fun definition() = ModuleDefinition {
    Name("ExpoTrustCore")

    /**
     * Generate a new BIP39 mnemonic phrase
     */
    Function("generateMnemonic") { strength: Int ->
      try {
        val wallet = HDWallet(strength, "")
        wallet.mnemonic()
      } catch (e: Exception) {
        throw Exception("Failed to generate mnemonic: ${e.message}")
      }
    }

    /**
     * Validate a mnemonic phrase
     */
    Function("validateMnemonic") { mnemonic: String ->
      try {
        Mnemonic.isValid(mnemonic)
      } catch (e: Exception) {
        false
      }
    }

    /**
     * Create a wallet from mnemonic
     */
    Function("createWallet") { mnemonic: String, passphrase: String ->
      try {
        val wallet = HDWallet(mnemonic, passphrase)
        mapOf(
          "mnemonic" to wallet.mnemonic(),
          "seed" to wallet.seed().toHexString()
        )
      } catch (e: Exception) {
        throw Exception("Failed to create wallet: ${e.message}")
      }
    }

    /**
     * Get address for a specific coin type with optional account index
     */
    Function("getAddress") { mnemonic: String, coinType: Int, accountIndex: Int? ->
      try {
        val accIndex = accountIndex ?: 0
        val wallet = HDWallet(mnemonic, "")
        val coin = CoinType.createFromValue(coinType)
        
        // For account 0, use default
        if (accIndex == 0) {
          return@Function wallet.getAddressForCoin(coin)
        }
        
        // For other accounts, derive manually with custom path (like iOS)
        val derivationPath = getDerivationPath(coin, accIndex)
        val privateKey = wallet.getKey(coin, derivationPath)
        coin.deriveAddress(privateKey)
      } catch (e: Exception) {
        throw Exception("Failed to get address: ${e.message}")
      }
    }

    /**
     * Get addresses for multiple coin types with optional account index
     */
    Function("getAddresses") { mnemonic: String, coinTypes: List<Int>, accountIndex: Int? ->
      try {
        val accIndex = accountIndex ?: 0
        val wallet = HDWallet(mnemonic, "")
        
        coinTypes.map { coinType ->
          val coin = CoinType.createFromValue(coinType)
          
          if (accIndex == 0) {
            wallet.getAddressForCoin(coin)
          } else {
            // For other accounts, derive manually with custom path (like iOS)
            val derivationPath = getDerivationPath(coin, accIndex)
            val privateKey = wallet.getKey(coin, derivationPath)
            coin.deriveAddress(privateKey)
          }
        }
      } catch (e: Exception) {
        throw Exception("Failed to get addresses: ${e.message}")
      }
    }

    /**
     * Validate an address for a specific coin type
     */
    Function("validateAddress") { address: String, coinType: Int ->
      try {
        val coin = CoinType.createFromValue(coinType)
        coin.validate(address)
      } catch (e: Exception) {
        false
      }
    }

    /**
     * Sign a transaction using Protocol Buffers
     */
    AsyncFunction("signTransaction") { mnemonic: String, coinType: Int, input: String, accountIndex: Int? ->
      try {
        val wallet = HDWallet(mnemonic, "")
        val coin = CoinType.createFromValue(coinType)
        val accIndex = accountIndex ?: 0
        
        // Parse JSON input
        val inputJSON = org.json.JSONObject(input)
        
        // Route to appropriate signing method based on coin type
        when (coin) {
          CoinType.ETHEREUM -> signEthereumTransaction(wallet, inputJSON, accIndex)
          CoinType.SOLANA -> signSolanaTransaction(wallet, inputJSON, accIndex)
          CoinType.BITCOIN, CoinType.DOGECOIN -> signBitcoinTransaction(wallet, coin, inputJSON, accIndex)
          else -> throw Exception("Transaction signing not yet implemented for $coin")
        }
      } catch (e: Exception) {
        throw Exception("Failed to sign transaction: ${e.message}")
      }
    }

    /**
     * Sign a message (personal_sign for Ethereum, raw sign for Solana)
     */
    Function("signMessage") { mnemonic: String, message: String, coinType: Int ->
      try {
        val wallet = HDWallet(mnemonic, "")
        val coin = CoinType.createFromValue(coinType)
        
        when (coin) {
          CoinType.ETHEREUM -> {
            // Ethereum personal_sign (EIP-191): "\x19Ethereum Signed Message:\n" + len(message) + message
            val messageBytes = message.toByteArray(Charsets.UTF_8)
            val prefix = "\u0019Ethereum Signed Message:\n${messageBytes.size}"
            val prefixedMessage = prefix.toByteArray(Charsets.UTF_8) + messageBytes
            val hash = Hash.keccak256(prefixedMessage)
            
            val privateKey = wallet.getKey(coin, "m/44'/60'/0'/0/0")
            val signature = privateKey.sign(hash, Curve.SECP256K1)
            
            signature.toHexString()
          }
          CoinType.SOLANA -> {
            val messageBytes = message.toByteArray(Charsets.UTF_8)
            val privateKey = wallet.getKey(coin, "m/44'/501'/0'/0'")
            val signature = privateKey.sign(messageBytes, Curve.ED25519)
            
            signature.toHexString()
          }
          else -> {
            throw Exception("Message signing not supported for this chain")
          }
        }
      } catch (e: Exception) {
        throw Exception("Failed to sign message: ${e.message}")
      }
    }

    /**
     * Sign EIP-712 typed data (Ethereum only)
     */
    Function("signTypedData") { mnemonic: String, typedDataJSON: String, coinType: Int ->
      try {
        // Only Ethereum supports EIP-712
        val coin = CoinType.createFromValue(coinType)
        if (coin != CoinType.ETHEREUM) {
          throw Exception("EIP-712 signing only supported for Ethereum")
        }
        
        val wallet = HDWallet(mnemonic, "")
        
        // Encode using EIP-712 (EIP-712 compliant implementation)
        val hash = EIP712Encoder.encodeAndHash(typedDataJSON)
        
        // Sign the hash
        val privateKey = wallet.getKey(coin, "m/44'/60'/0'/0/0")
        val signature = privateKey.sign(hash, Curve.SECP256K1)
        
        signature.toHexString()
      } catch (e: Exception) {
        throw Exception("Failed to sign EIP-712 data: ${e.message}")
      }
    }

    /**
     * Export private key for a specific coin and account
     * ⚠️ SECURITY: Handle with extreme care!
     */
    Function("getPrivateKey") { mnemonic: String, coinType: Int, accountIndex: Int? ->
      try {
        val accIndex = accountIndex ?: 0
        val wallet = HDWallet(mnemonic, "")
        val coin = CoinType.createFromValue(coinType)
        
        val derivationPath = getDerivationPath(coin, accIndex)
        val privateKey = wallet.getKey(coin, derivationPath)
        
        privateKey.data().toHexString()
      } catch (e: Exception) {
        throw Exception("Failed to get private key: ${e.message}")
      }
    }

    /**
     * Export public key for a specific coin and account
     */
    Function("getPublicKey") { mnemonic: String, coinType: Int, accountIndex: Int? ->
      try {
        val accIndex = accountIndex ?: 0
        val wallet = HDWallet(mnemonic, "")
        val coin = CoinType.createFromValue(coinType)
        
        val derivationPath = getDerivationPath(coin, accIndex)
        val privateKey = wallet.getKey(coin, derivationPath)
        
        val publicKey = privateKey.getPublicKeySecp256k1(true)
        publicKey.data().toHexString()
      } catch (e: Exception) {
        throw Exception("Failed to get public key: ${e.message}")
      }
    }

    /**
     * Import wallet from private key (single chain only)
     */
    Function("importFromPrivateKey") { privateKeyHex: String, coinType: Int ->
      try {
        val coin = CoinType.createFromValue(coinType)
        val keyData = hexStringToByteArray(privateKeyHex)
        val privateKey = PrivateKey(keyData)
        
        val address = coin.deriveAddress(privateKey)
        val publicKey = privateKey.getPublicKeySecp256k1(true)
        
        mapOf(
          "address" to address,
          "publicKey" to publicKey.data().toHexString(),
          "coinType" to coinType
        )
      } catch (e: Exception) {
        throw Exception("Failed to import from private key: ${e.message}")
      }
    }

    /**
     * Sign raw transaction hash (advanced - for custom transaction building)
     */
    Function("signRawTransaction") { mnemonic: String, txHash: String, coinType: Int, accountIndex: Int? ->
      try {
        val accIndex = accountIndex ?: 0
        val wallet = HDWallet(mnemonic, "")
        val coin = CoinType.createFromValue(coinType)
        
        val derivationPath = getDerivationPath(coin, accIndex)
        val privateKey = wallet.getKey(coin, derivationPath)
        
        val hashBytes = hexStringToByteArray(txHash)
        val signature = privateKey.sign(hashBytes, Curve.SECP256K1)
        
        signature.toHexString()
      } catch (e: Exception) {
        throw Exception("Failed to sign raw transaction: ${e.message}")
      }
    }
  }
  
  // MARK: Transaction Signing Helper Functions
  
  /**
   * Sign Ethereum transaction using Protocol Buffers
   */
  private fun signEthereumTransaction(wallet: HDWallet, inputJSON: org.json.JSONObject, accountIndex: Int): String {
    val coin = CoinType.ETHEREUM
    val derivationPath = "m/44'/60'/$accountIndex'/0/0"
    val privateKey = wallet.getKey(coin, derivationPath)
    
    // Parse input parameters
    val toAddress = inputJSON.getString("to")
    val value = inputJSON.getString("value")
    val gasPrice = inputJSON.optString("gasPrice", "20000000000")  // 20 gwei default
    val gasLimit = inputJSON.optString("gasLimit", "21000")
    val nonce = inputJSON.optInt("nonce", 0)
    val chainId = inputJSON.optInt("chainId", 1)  // Mainnet default
    val data = inputJSON.optString("data", "0x")
    
    // Check if EIP-1559 transaction
    val maxFeePerGas = if (inputJSON.has("maxFeePerGas")) inputJSON.getString("maxFeePerGas") else null
    val maxPriorityFeePerGas = if (inputJSON.has("maxPriorityFeePerGas")) inputJSON.getString("maxPriorityFeePerGas") else null
    val isEIP1559 = maxFeePerGas != null && maxPriorityFeePerGas != null
    
    // Convert hex strings to ByteString
    val valueBytes = ByteString.copyFrom(hexStringToByteArray(value))
    val gasPriceBytes = ByteString.copyFrom(hexStringToByteArray(gasPrice))
    val gasLimitBytes = ByteString.copyFrom(hexStringToByteArray(gasLimit))
    val chainIdBytes = ByteString.copyFrom(byteArrayOf(chainId.toByte()))
    val nonceBytes = ByteString.copyFrom(byteArrayOf(nonce.toByte()))
    val dataBytes = ByteString.copyFrom(hexStringToByteArray(data))
    
    // Build Ethereum SigningInput
    val signingInputBuilder = Ethereum.SigningInput.newBuilder()
      .setChainId(chainIdBytes)
      .setNonce(nonceBytes)
      .setGasLimit(gasLimitBytes)
      .setToAddress(toAddress)
      .setPrivateKey(ByteString.copyFrom(privateKey.data()))
    
    if (isEIP1559 && maxFeePerGas != null && maxPriorityFeePerGas != null) {
      // EIP-1559 transaction
      val maxFeeBytes = ByteString.copyFrom(hexStringToByteArray(maxFeePerGas))
      val maxPriorityBytes = ByteString.copyFrom(hexStringToByteArray(maxPriorityFeePerGas))
      
      signingInputBuilder
        .setTxMode(Ethereum.TransactionMode.Enveloped)
        .setMaxFeePerGas(maxFeeBytes)
        .setMaxInclusionFeePerGas(maxPriorityBytes)
    } else {
      // Legacy transaction
      signingInputBuilder
        .setTxMode(Ethereum.TransactionMode.Legacy)
        .setGasPrice(gasPriceBytes)
    }
    
    // Set transaction type
    val transfer = Ethereum.Transaction.Transfer.newBuilder()
      .setAmount(valueBytes)
      .setData(dataBytes)
      .build()
    
    val transaction = Ethereum.Transaction.newBuilder()
      .setTransfer(transfer)
      .build()
    
    signingInputBuilder.setTransaction(transaction)
    
    // Sign transaction
    val signingInput = signingInputBuilder.build()
    val output = AnySigner.sign(signingInput, coin, Ethereum.SigningOutput.parser())
    
    if (output.error != Common.SigningError.OK) {
      throw Exception("Signing failed: ${output.errorMessage}")
    }
    
    // Return hex-encoded signed transaction
    return "0x" + output.encoded.toByteArray().toHexString()
  }
  
  /**
   * Sign Solana transaction using Protocol Buffers
   */
  private fun signSolanaTransaction(wallet: HDWallet, inputJSON: org.json.JSONObject, accountIndex: Int): String {
    val coin = CoinType.SOLANA
    val derivationPath = "m/44'/501'/$accountIndex'/0'"
    val privateKey = wallet.getKey(coin, derivationPath)
    val senderAddress = coin.deriveAddress(privateKey)
    
    // Parse input parameters
    val recentBlockhash = inputJSON.getString("recentBlockhash")
    val recipient = inputJSON.getString("recipient")
    val amount = inputJSON.getString("amount").toLong()
    
    // Build simple SOL transfer
    val transfer = Solana.Transfer.newBuilder()
      .setRecipient(recipient)
      .setValue(amount)
      .build()
    
    val signingInput = Solana.SigningInput.newBuilder()
      .setPrivateKey(ByteString.copyFrom(privateKey.data()))
      .setRecentBlockhash(recentBlockhash)
      .setSender(senderAddress)
      .setTransferTransaction(transfer)
      .setTxEncoding(Solana.Encoding.Base64)
      .build()
    
    val output = AnySigner.sign(signingInput, coin, Solana.SigningOutput.parser())
    
    if (output.error != Common.SigningError.OK) {
      throw Exception("Signing failed: ${output.errorMessage}")
    }
    
    return output.encoded
  }
  
  /**
   * Sign Bitcoin/Dogecoin transaction using Protocol Buffers
   */
  private fun signBitcoinTransaction(wallet: HDWallet, coin: CoinType, inputJSON: org.json.JSONObject, accountIndex: Int): String {
    // Derive private key
    val derivationPath = when (coin) {
      CoinType.BITCOIN -> "m/84'/0'/$accountIndex'/0/0"  // Native SegWit
      CoinType.DOGECOIN -> "m/44'/3'/$accountIndex'/0/0"
      else -> "m/44'/${coin.value()}/$accountIndex'/0/0"
    }
    
    val privateKey = wallet.getKey(coin, derivationPath)
    val fromAddress = coin.deriveAddress(privateKey)
    
    // Parse input parameters
    val utxosArray = inputJSON.getJSONArray("utxos")
    val toAddress = inputJSON.getString("toAddress")
    val amount = inputJSON.getLong("amount")
    val byteFee = inputJSON.optLong("byteFee", 1)
    val changeAddress = inputJSON.optString("changeAddress", fromAddress)
    
    // Build UTXOs
    val utxos = mutableListOf<Bitcoin.UnspentTransaction>()
    for (i in 0 until utxosArray.length()) {
      val utxoJSON = utxosArray.getJSONObject(i)
      val txid = utxoJSON.getString("txid")
      val vout = utxoJSON.getInt("vout")
      val value = utxoJSON.getLong("value")
      val scriptPubKey = utxoJSON.getString("scriptPubKey")
      
      val txidBytes = hexStringToByteArray(txid).reversedArray()  // Bitcoin uses reversed hash
      val scriptBytes = hexStringToByteArray(scriptPubKey)
      
      val outPoint = Bitcoin.OutPoint.newBuilder()
        .setHash(ByteString.copyFrom(txidBytes))
        .setIndex(vout)
        .setSequence(0xFFFFFFFF.toInt())
        .build()
      
      val utxo = Bitcoin.UnspentTransaction.newBuilder()
        .setOutPoint(outPoint)
        .setAmount(value)
        .setScript(ByteString.copyFrom(scriptBytes))
        .build()
      
      utxos.add(utxo)
    }
    
    if (utxos.isEmpty()) {
      throw Exception("No valid UTXOs provided")
    }
    
    // Build signing input
    val signingInput = Bitcoin.SigningInput.newBuilder()
      .setHashType(BitcoinScript.hashTypeForCoin(coin))
      .setAmount(amount)
      .setByteFee(byteFee)
      .setToAddress(toAddress)
      .setChangeAddress(changeAddress)
      .addPrivateKey(ByteString.copyFrom(privateKey.data()))
      .addAllUtxo(utxos)
      .build()
    
    // Sign transaction
    val output = AnySigner.sign(signingInput, coin, Bitcoin.SigningOutput.parser())
    
    if (output.error != Common.SigningError.OK) {
      throw Exception("Signing failed: ${output.errorMessage}")
    }
    
    // Return hex-encoded signed transaction
    return output.encoded.toByteArray().toHexString()
  }
}

// Extension function to convert ByteArray to hex string
private fun ByteArray.toHexString(): String {
  return this.joinToString("") { "%02x".format(it) }
}

// Helper to convert hex string to byte array
private fun hexStringToByteArray(hex: String): ByteArray {
  val cleanHex = hex.removePrefix("0x")
  return cleanHex.chunked(2)
    .map { it.toInt(16).toByte() }
    .toByteArray()
}
