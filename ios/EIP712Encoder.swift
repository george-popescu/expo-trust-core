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
        // String or bytes - hash them
        if type == "string" {
            if let str = value as? String {
                return Hash.keccak256(data: Data(str.utf8))
            }
        }
        
        if type == "bytes" {
            if let str = value as? String {
                let bytes = str.hasPrefix("0x") ? Data(hexString: String(str.dropFirst(2))) : Data(str.utf8)
                return Hash.keccak256(data: bytes)
            }
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
        
        // Custom struct type - recursively hash
        if types[type] != nil {
            if let structData = value as? [String: Any] {
                return try hashStruct(type: type, data: structData, types: types)
            }
        }
        
        // Default: zero bytes
        return Data(count: 32)
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
        result.append(Data(hexString: cleanAddr))
        return result
    }
    
    private static func encodeNumber(_ value: Any) throws -> Data {
        let num: UInt64
        
        if let intVal = value as? Int {
            num = UInt64(intVal)
        } else if let strVal = value as? String {
            let cleanStr = strVal.hasPrefix("0x") ? String(strVal.dropFirst(2)) : strVal
            num = UInt64(cleanStr, radix: 16) ?? 0
        } else {
            num = 0
        }
        
        // Encode as 32-byte big-endian
        var result = Data(count: 32)
        for i in 0..<8 {
            let byte = UInt8((num >> (8 * (7 - i))) & 0xFF)
            result[24 + i] = byte
        }
        return result
    }
}

extension Data {
    init(hexString: String) {
        var hex = hexString
        var data = Data()
        while hex.count > 0 {
            let length = Swift.min(2, hex.count)
            let subIndex = hex.index(hex.startIndex, offsetBy: length)
            let c = String(hex[..<subIndex])
            hex = String(hex[subIndex...])
            if let byte = UInt8(c, radix: 16) {
                data.append(byte)
            }
        }
        self = data
    }
}

