import Foundation
import WalletCore

/**
 * Production-ready EIP-712 Encoder
 * Implements https://eips.ethereum.org/EIPS/eip-712
 */
class EIP712Encoder {
    
    static func encodeAndHash(typedData: [String: Any]) throws -> Data {
        guard let domain = typedData["domain"] as? [String: Any],
              let types = typedData["types"] as? [String: [Any]],
              let primaryType = typedData["primaryType"] as? String,
              let message = typedData["message"] as? [String: Any] else {
            throw NSError(domain: "EIP712", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Invalid EIP-712 structure"
            ])
        }
        
        // 1. Hash domain separator
        let domainHash = try hashStruct(type: "EIP712Domain", data: domain, types: types)
        
        // 2. Hash message
        let messageHash = try hashStruct(type: primaryType, data: message, types: types)
        
        // 3. Create final hash: keccak256("\x19\x01" + domainHash + messageHash)
        var finalData = Data([0x19, 0x01])
        finalData.append(domainHash)
        finalData.append(messageHash)
        
        return Hash.keccak256(data: finalData)
    }
    
    private static func hashStruct(type: String, data: [String: Any], types: [String: [Any]]) throws -> Data {
        guard let typeFields = types[type] as? [[String: String]] else {
            throw NSError(domain: "EIP712", code: 2, userInfo: [
                NSLocalizedDescriptionKey: "Type not found: \(type)"
            ])
        }
        
        // Encode type string and hash it
        let typeString = encodeType(type: type, types: types)
        let typeHash = Hash.keccak256(data: Data(typeString.utf8))
        
        // Start with type hash
        var encoded = typeHash
        
        // Encode each field value
        for field in typeFields {
            guard let fieldName = field["name"],
                  let fieldType = field["type"] else {
                continue
            }
            
            if let value = data[fieldName] {
                let encodedValue = try encodeValue(value: value, type: fieldType, types: types)
                encoded.append(encodedValue)
            } else {
                // Missing field - use zero bytes
                encoded.append(Data(count: 32))
            }
        }
        
        return Hash.keccak256(data: encoded)
    }
    
    private static func encodeType(type: String, types: [String: [Any]]) -> String {
        guard let fields = types[type] as? [[String: String]] else {
            return "\(type)()"
        }
        
        let fieldStrings = fields.compactMap { field -> String? in
            guard let name = field["name"], let type = field["type"] else { return nil }
            return "\(type) \(name)"
        }
        
        return "\(type)(\(fieldStrings.joined(separator: ",")))"
    }
    
    private static func encodeValue(value: Any, type: String, types: [String: [Any]]) throws -> Data {
        // String - hash it
        if type == "string" {
            if let str = value as? String {
                return Hash.keccak256(data: Data(str.utf8))
            }
        }

        // Dynamic bytes - hash it
        if type == "bytes" {
            if let str = value as? String {
                let bytes = str.hasPrefix("0x") ? Data(eip712HexString: String(str.dropFirst(2))) : Data(str.utf8)
                return Hash.keccak256(data: bytes)
            }
        }

        // Fixed-size bytes (bytes1...bytes32) - right-pad to 32 bytes, NO hashing
        if let byteCount = isBytesN(type) {
            return try encodeBytesN(value: value, size: byteCount)
        }

        // Address - pad to 32 bytes
        if type == "address" {
            if let addr = value as? String {
                return try encodeAddress(addr)
            }
        }

        // Numeric types
        if type.hasPrefix("uint") || type.hasPrefix("int") {
            return try encodeNumber(value)
        }

        // Bool
        if type == "bool" {
            let boolValue = (value as? Bool) ?? false
            return try encodeNumber(boolValue ? 1 : 0)
        }

        // Array types (T[]) - hash concatenated encoded elements
        if let elementType = isArrayType(type) {
            return try encodeArray(value: value, elementType: elementType, types: types)
        }

        // Custom struct type - recursively hash
        if types[type] != nil {
            if let structData = value as? [String: Any] {
                return try hashStruct(type: type, data: structData, types: types)
            }
        }

        // Default: zero bytes
        return Data(count: 32)
    }

    /// Check if type is a fixed-size bytes type (bytes1...bytes32)
    /// Returns the byte count (1-32) or nil if not a bytesN type
    private static func isBytesN(_ type: String) -> Int? {
        guard type.hasPrefix("bytes") else { return nil }
        let suffix = String(type.dropFirst(5))
        guard let count = Int(suffix), count >= 1, count <= 32 else { return nil }
        // Ensure no leading zeros or other characters (e.g., "bytes01" is invalid)
        guard suffix == String(count) else { return nil }
        return count
    }

    /// Encode a bytesN value - right-padded with zeros to 32 bytes
    private static func encodeBytesN(value: Any, size: Int) throws -> Data {
        guard let strVal = value as? String else {
            throw NSError(domain: "EIP712", code: 5, userInfo: [
                NSLocalizedDescriptionKey: "bytesN value must be a string"
            ])
        }

        let cleanHex = strVal.hasPrefix("0x") ? String(strVal.dropFirst(2)) : strVal
        let bytes = Data(eip712HexString: cleanHex)

        guard bytes.count == size else {
            throw NSError(domain: "EIP712", code: 6, userInfo: [
                NSLocalizedDescriptionKey: "bytes\(size) value has wrong length: expected \(size) bytes, got \(bytes.count)"
            ])
        }

        // Right-pad with zeros to 32 bytes
        var result = bytes
        result.append(Data(count: 32 - size))
        return result
    }

    /// Check if type is an array type (T[])
    /// Returns the base element type or nil if not an array
    private static func isArrayType(_ type: String) -> String? {
        guard type.hasSuffix("[]") else { return nil }
        return String(type.dropLast(2))
    }

    /// Encode an array value - keccak256 of concatenated encoded elements
    private static func encodeArray(value: Any, elementType: String, types: [String: [Any]]) throws -> Data {
        guard let arrayValue = value as? [Any] else {
            throw NSError(domain: "EIP712", code: 7, userInfo: [
                NSLocalizedDescriptionKey: "Array value must be an array"
            ])
        }

        // Empty array: keccak256 of empty data
        if arrayValue.isEmpty {
            return Hash.keccak256(data: Data())
        }

        // Encode each element and concatenate
        var concatenated = Data()
        for element in arrayValue {
            let encodedElement = try encodeValue(value: element, type: elementType, types: types)
            concatenated.append(encodedElement)
        }

        // Hash the concatenated result
        return Hash.keccak256(data: concatenated)
    }
    
    private static func encodeAddress(_ address: String) throws -> Data {
        let cleanAddr = address.hasPrefix("0x") ? String(address.dropFirst(2)) : address
        guard cleanAddr.count == 40 else {
            throw NSError(domain: "EIP712", code: 3, userInfo: [
                NSLocalizedDescriptionKey: "Invalid address length"
            ])
        }
        
        // Pad 12 zero bytes + 20 address bytes
        var result = Data(count: 12)
        result.append(Data(eip712HexString: cleanAddr))
        return result
    }
    
    private static func encodeNumber(_ value: Any) throws -> Data {
        // Handle different numeric representations
        if let intVal = value as? Int {
            return encodeUInt64(UInt64(intVal))
        } else if let intVal = value as? Int64 {
            return encodeUInt64(UInt64(intVal))
        } else if let uintVal = value as? UInt64 {
            return encodeUInt64(uintVal)
        } else if let strVal = value as? String {
            // Check if hex-prefixed
            if strVal.hasPrefix("0x") || strVal.hasPrefix("0X") {
                let cleanStr = String(strVal.dropFirst(2))
                // Hex string - parse as hex, handle large numbers
                return try encodeHexString(cleanStr)
            } else {
                // Decimal string - could be small or BigInt
                return try encodeDecimalString(strVal)
            }
        } else {
            return Data(count: 32)
        }
    }

    private static func encodeUInt64(_ num: UInt64) -> Data {
        // Encode as 32-byte big-endian
        var result = Data(count: 32)
        for i in 0..<8 {
            let byte = UInt8((num >> (8 * (7 - i))) & 0xFF)
            result[24 + i] = byte
        }
        return result
    }

    private static func encodeHexString(_ hex: String) throws -> Data {
        // Pad to 64 chars (32 bytes) with leading zeros
        let paddedHex = String(repeating: "0", count: max(0, 64 - hex.count)) + hex
        guard paddedHex.count == 64 else {
            throw NSError(domain: "EIP712", code: 4, userInfo: [
                NSLocalizedDescriptionKey: "Number too large for uint256"
            ])
        }
        return Data(eip712HexString: paddedHex)
    }

    private static func encodeDecimalString(_ decimal: String) throws -> Data {
        // Try to parse as UInt64 first (fast path for small numbers)
        if let num = UInt64(decimal) {
            return encodeUInt64(num)
        }

        // For large numbers (BigInt), convert decimal to hex
        // This handles uint256 values that don't fit in UInt64
        let hexString = decimalToHex(decimal)
        return try encodeHexString(hexString)
    }

    /// Convert a decimal string to hex string (for BigInt support)
    private static func decimalToHex(_ decimal: String) -> String {
        var result = ""
        var temp = Array(decimal)

        while !temp.isEmpty && !(temp.count == 1 && temp[0] == "0") {
            var carry = 0
            var newTemp: [Character] = []

            for char in temp {
                let digit = carry * 10 + Int(String(char))!
                carry = digit % 16
                let quotient = digit / 16
                if !newTemp.isEmpty || quotient > 0 {
                    newTemp.append(Character(String(quotient)))
                }
            }

            let hexChar = String(carry, radix: 16)
            result = hexChar + result
            temp = newTemp
        }

        return result.isEmpty ? "0" : result
    }
}

extension Data {
    init(eip712HexString hex: String) {
        var hexStr = hex
        var data = Data()
        while hexStr.count > 0 {
            let length = Swift.min(2, hexStr.count)
            let subIndex = hexStr.index(hexStr.startIndex, offsetBy: length)
            let c = String(hexStr[..<subIndex])
            hexStr = String(hexStr[subIndex...])
            if let byte = UInt8(c, radix: 16) {
                data.append(byte)
            }
        }
        self = data
    }
}

