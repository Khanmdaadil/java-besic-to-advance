package com.messenger.encryption;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.*;
import java.util.Base64;

/**
 * Encryption Service implementing AES-256 encryption for end-to-end message security
 */
@Service
public class EncryptionService {

    private static final int AES_KEY_SIZE = 256;
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;
    private static final String ALGORITHM = "AES/GCM/NoPadding";

    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    /**
     * Generate a new AES-256 key for symmetric encryption
     * @return Base64 encoded key string
     * @throws Exception if key generation fails
     */
    public String generateAESKey() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(AES_KEY_SIZE);
        SecretKey key = keyGen.generateKey();
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    /**
     * Encrypt data using AES-256 in GCM mode
     * @param plaintext The data to encrypt
     * @param keyBase64 Base64 encoded AES key
     * @return Encrypted data with IV prepended, Base64 encoded
     * @throws Exception if encryption fails
     */
    public String encrypt(String plaintext, String keyBase64) throws Exception {
        // Decode the Base64 encoded key
        byte[] keyBytes = Base64.getDecoder().decode(keyBase64);
        SecretKey key = new SecretKeySpec(keyBytes, "AES");
        
        // Generate a random IV
        byte[] iv = new byte[GCM_IV_LENGTH];
        SecureRandom random = new SecureRandom();
        random.nextBytes(iv);
        
        // Initialize cipher for encryption
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv));
        
        // Encrypt
        byte[] cipherText = cipher.doFinal(plaintext.getBytes());
        
        // Prepend IV to ciphertext and encode in Base64
        byte[] encryptedData = new byte[iv.length + cipherText.length];
        System.arraycopy(iv, 0, encryptedData, 0, iv.length);
        System.arraycopy(cipherText, 0, encryptedData, iv.length, cipherText.length);
        
        return Base64.getEncoder().encodeToString(encryptedData);
    }

    /**
     * Decrypt data using AES-256 in GCM mode
     * @param encryptedBase64 Base64 encoded encrypted data with IV prepended
     * @param keyBase64 Base64 encoded AES key
     * @return Decrypted data as String
     * @throws Exception if decryption fails
     */
    public String decrypt(String encryptedBase64, String keyBase64) throws Exception {
        // Decode the encrypted data and key from Base64
        byte[] encryptedData = Base64.getDecoder().decode(encryptedBase64);
        byte[] keyBytes = Base64.getDecoder().decode(keyBase64);
        
        // Extract IV from the encrypted data
        byte[] iv = new byte[GCM_IV_LENGTH];
        byte[] cipherText = new byte[encryptedData.length - GCM_IV_LENGTH];
        System.arraycopy(encryptedData, 0, iv, 0, iv.length);
        System.arraycopy(encryptedData, iv.length, cipherText, 0, cipherText.length);
        
        // Initialize cipher for decryption
        SecretKey key = new SecretKeySpec(keyBytes, "AES");
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv));
        
        // Decrypt
        byte[] plainText = cipher.doFinal(cipherText);
        
        return new String(plainText);
    }

    /**
     * Generate a key pair for asymmetric encryption (RSA)
     * @return KeyPair object containing public and private keys
     * @throws Exception if key generation fails
     */
    public KeyPair generateKeyPair() throws Exception {
        KeyPairGenerator keyPairGen = KeyPairGenerator.getInstance("RSA");
        keyPairGen.initialize(2048);
        return keyPairGen.generateKeyPair();
    }

    /**
     * Encode a key to Base64 string
     * @param key The key to encode
     * @return Base64 encoded key
     */
    public String keyToString(Key key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }
}
