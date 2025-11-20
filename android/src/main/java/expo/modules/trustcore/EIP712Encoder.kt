package expo.modules.trustcore

import org.json.JSONObject
import org.json.JSONArray
import wallet.core.jni.Hash
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Production-ready EIP-712 Encoder for Android
 * Implements https://eips.ethereum.org/EIPS/eip-712
 */
object EIP712Encoder {
    
    fun encodeAndHash(typedDataJSON: String): ByteArray {
        val typedData = JSONObject(typedDataJSON)
        
        val domain = typedData.getJSONObject("domain")
        val types = typedData.getJSONObject("types")
        val primaryType = typedData.getString("primaryType")
        val message = typedData.getJSONObject("message")
        
        // 1. Hash domain separator
        val domainHash = hashStruct("EIP712Domain", domain, types)
        
        // 2. Hash message
        val messageHash = hashStruct(primaryType, message, types)
        
        // 3. Final hash: keccak256("\x19\x01" + domainHash + messageHash)
        val finalData = byteArrayOf(0x19.toByte(), 0x01.toByte()) + domainHash + messageHash
        
        return Hash.keccak256(finalData)
    }
    
    private fun hashStruct(type: String, data: JSONObject, types: JSONObject): ByteArray {
        val typeFields = types.getJSONArray(type)
        
        // Encode type string
        val typeString = encodeType(type, types)
        val typeHash = Hash.keccak256(typeString.toByteArray())
        
        // Start with type hash
        var encoded = typeHash
        
        // Encode each field
        for (i in 0 until typeFields.length()) {
            val field = typeFields.getJSONObject(i)
            val fieldName = field.getString("name")
            val fieldType = field.getString("type")
            
            val value = if (data.has(fieldName)) data.get(fieldName) else null
            val encodedValue = encodeValue(value, fieldType, types)
            encoded += encodedValue
        }
        
        return Hash.keccak256(encoded)
    }
    
    private fun encodeType(type: String, types: JSONObject): String {
        val fields = types.getJSONArray(type)
        val fieldStrings = mutableListOf<String>()
        
        for (i in 0 until fields.length()) {
            val field = fields.getJSONObject(i)
            val name = field.getString("name")
            val fieldType = field.getString("type")
            fieldStrings.add("$fieldType $name")
        }
        
        return "$type(${fieldStrings.joinToString(",")})"
    }
    
    private fun encodeValue(value: Any?, type: String, types: JSONObject): ByteArray {
        if (value == null) {
            return ByteArray(32) // Zero bytes
        }
        
        return when {
            type == "string" -> {
                Hash.keccak256(value.toString().toByteArray())
            }
            type == "bytes" -> {
                val str = value.toString()
                val bytes = if (str.startsWith("0x")) {
                    hexStringToByteArray(str.substring(2))
                } else {
                    str.toByteArray()
                }
                Hash.keccak256(bytes)
            }
            type == "address" -> {
                encodeAddress(value.toString())
            }
            type.startsWith("uint") || type.startsWith("int") -> {
                encodeNumber(value)
            }
            type == "bool" -> {
                encodeNumber(if (value.toString().toBoolean()) 1 else 0)
            }
            types.has(type) -> {
                // Custom struct - recursively hash
                val structData = when (value) {
                    is JSONObject -> value
                    is String -> JSONObject(value)
                    else -> JSONObject(value.toString())
                }
                hashStruct(type, structData, types)
            }
            else -> ByteArray(32) // Unknown type
        }
    }
    
    private fun encodeAddress(address: String): ByteArray {
        val cleanAddr = address.removePrefix("0x")
        require(cleanAddr.length == 40) { "Invalid address length" }
        
        // Pad 12 zero bytes + 20 address bytes = 32 bytes
        val result = ByteArray(12) + hexStringToByteArray(cleanAddr)
        return result
    }
    
    private fun encodeNumber(value: Any): ByteArray {
        val num: Long = when (value) {
            is Int -> value.toLong()
            is Long -> value
            is String -> {
                val clean = value.removePrefix("0x")
                clean.toLongOrNull(16) ?: clean.toLongOrNull() ?: 0L
            }
            else -> 0L
        }
        
        // Encode as 32-byte big-endian
        val buffer = ByteBuffer.allocate(32)
        buffer.order(ByteOrder.BIG_ENDIAN)
        buffer.position(24) // Last 8 bytes
        buffer.putLong(num)
        return buffer.array()
    }
    
    private fun hexStringToByteArray(hex: String): ByteArray {
        return hex.chunked(2)
            .map { it.toInt(16).toByte() }
            .toByteArray()
    }
}

