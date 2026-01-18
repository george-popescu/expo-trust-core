package expo.modules.trustcore

import org.json.JSONObject
import org.json.JSONArray
import wallet.core.jni.Hash
import java.math.BigInteger
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
            // Fixed-size bytes (bytes1...bytes32) - right-pad to 32 bytes, NO hashing
            isBytesN(type) != null -> {
                val size = isBytesN(type)!!
                encodeBytesN(value.toString(), size)
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
            // Array types (T[]) - hash concatenated encoded elements
            isArrayType(type) != null -> {
                val elementType = isArrayType(type)!!
                val arrayValue = when (value) {
                    is JSONArray -> value
                    is List<*> -> JSONArray(value)
                    else -> JSONArray(value.toString())
                }
                encodeArray(arrayValue, elementType, types)
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

    /**
     * Check if type is a fixed-size bytes type (bytes1...bytes32)
     * Returns the byte count (1-32) or null if not a bytesN type
     */
    private fun isBytesN(type: String): Int? {
        val regex = Regex("^bytes([1-9]|[12][0-9]|3[0-2])$")
        val match = regex.matchEntire(type) ?: return null
        return match.groupValues[1].toInt()
    }

    /**
     * Encode a bytesN value - right-padded with zeros to 32 bytes
     */
    private fun encodeBytesN(value: String, size: Int): ByteArray {
        val cleanHex = value.removePrefix("0x").removePrefix("0X")
        val bytes = hexStringToByteArray(cleanHex)

        require(bytes.size == size) {
            "bytes$size value has wrong length: expected $size bytes, got ${bytes.size}"
        }

        // Right-pad with zeros to 32 bytes
        val result = ByteArray(32)
        System.arraycopy(bytes, 0, result, 0, size)
        return result
    }

    /**
     * Check if type is an array type (T[])
     * Returns the base element type or null if not an array
     */
    private fun isArrayType(type: String): String? {
        return if (type.endsWith("[]")) type.removeSuffix("[]") else null
    }

    /**
     * Encode an array value - keccak256 of concatenated encoded elements
     */
    private fun encodeArray(arrayValue: JSONArray, elementType: String, types: JSONObject): ByteArray {
        // Empty array: keccak256 of empty data
        if (arrayValue.length() == 0) {
            return Hash.keccak256(ByteArray(0))
        }

        // Encode each element and concatenate
        var concatenated = ByteArray(0)
        for (i in 0 until arrayValue.length()) {
            val element = arrayValue.get(i)
            val encodedElement = encodeValue(element, elementType, types)
            concatenated += encodedElement
        }

        // Hash the concatenated result
        return Hash.keccak256(concatenated)
    }
    
    private fun encodeAddress(address: String): ByteArray {
        val cleanAddr = address.removePrefix("0x")
        require(cleanAddr.length == 40) { "Invalid address length" }
        
        // Pad 12 zero bytes + 20 address bytes = 32 bytes
        val result = ByteArray(12) + hexStringToByteArray(cleanAddr)
        return result
    }
    
    private fun encodeNumber(value: Any): ByteArray {
        val bigInt: BigInteger = when (value) {
            is Int -> BigInteger.valueOf(value.toLong())
            is Long -> BigInteger.valueOf(value)
            is BigInteger -> value
            is String -> {
                val clean = value.removePrefix("0x").removePrefix("0X")
                if (value.startsWith("0x") || value.startsWith("0X")) {
                    // Hex string
                    try {
                        BigInteger(clean, 16)
                    } catch (e: NumberFormatException) {
                        BigInteger.ZERO
                    }
                } else {
                    // Decimal string
                    try {
                        BigInteger(clean, 10)
                    } catch (e: NumberFormatException) {
                        BigInteger.ZERO
                    }
                }
            }
            else -> BigInteger.ZERO
        }

        // Encode as 32-byte big-endian (uint256)
        val bytes = bigInt.toByteArray()
        val result = ByteArray(32)

        // BigInteger.toByteArray() may have leading zero byte for positive numbers
        // or be shorter than 32 bytes - we need to handle both cases
        if (bytes.size <= 32) {
            // Copy to end of 32-byte array (big-endian, right-aligned)
            System.arraycopy(bytes, 0, result, 32 - bytes.size, bytes.size)
        } else if (bytes.size == 33 && bytes[0] == 0.toByte()) {
            // BigInteger added a leading zero byte for sign - skip it
            System.arraycopy(bytes, 1, result, 0, 32)
        } else {
            // Number too large for uint256 - truncate (shouldn't happen for valid EIP-712)
            System.arraycopy(bytes, bytes.size - 32, result, 0, 32)
        }

        return result
    }
    
    private fun hexStringToByteArray(hex: String): ByteArray {
        return hex.chunked(2)
            .map { it.toInt(16).toByte() }
            .toByteArray()
    }
}

