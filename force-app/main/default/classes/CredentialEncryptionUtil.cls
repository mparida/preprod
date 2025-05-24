public class CredentialEncryptionUtil {

    private static final String DELIMITER = ':'; // delimiter between IV and encrypted data
    
    // Retrieve encryption key from protected custom setting
    private static Blob getKey() {
        String keyString = CredentialEncryptionKey__c.getInstance().Key__c;
        if (String.isBlank(keyString)) {
            throw new AuraHandledException('Encryption key not configured.');
        }
        return EncodingUtil.base64Decode(keyString);
    }
    
    public static String encrypt(String plaintext) {
        Blob key = getKey();
        Blob iv = Crypto.generateAesKey(128); // 16 bytes IV
        Blob encrypted = Crypto.encrypt('AES128', key, iv, Blob.valueOf(plaintext));
        
        // Encode both to Base64 strings
        String ivBase64 = EncodingUtil.base64Encode(iv);
        String encryptedBase64 = EncodingUtil.base64Encode(encrypted);
        
        // Concatenate with delimiter
        return ivBase64 + DELIMITER + encryptedBase64;
    }
    
    public static String decrypt(String encryptedCombined) {
        Blob key = getKey();
        
        // Split IV and encrypted data by delimiter
        List<String> parts = encryptedCombined.split(DELIMITER);
        if (parts.size() != 2) {
            throw new AuraHandledException('Invalid encrypted data format.');
        }
        
        Blob iv = EncodingUtil.base64Decode(parts[0]);
        Blob encrypted = EncodingUtil.base64Decode(parts[1]);
        
        Blob decrypted = Crypto.decrypt('AES128', key, iv, encrypted);
        return decrypted.toString();
    }
}