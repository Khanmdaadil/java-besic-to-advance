package com.messenger.encryption;

import org.springframework.stereotype.Service;
import javax.crypto.KeyAgreement;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.*;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Implementation of Double Ratchet algorithm for perfect forward secrecy
 * This is a simplified version of the Signal protocol's Double Ratchet
 */
@Service
public class DoubleRatchetService {

    private final Map<String, KeyPair> dhRatchets = new HashMap<>();
    private final Map<String, byte[]> rootKeys = new HashMap<>();
    private final Map<String, byte[]> chainKeys = new HashMap<>();
    
    /**
     * Initialize a Double Ratchet session
     * @return Session ID for referencing this ratchet
     */
    public String initSession() {
        try {
            String sessionId = UUID.randomUUID().toString();
            
            // Generate initial DH key pair
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("EC");
            keyGen.initialize(256);
            KeyPair dhKeyPair = keyGen.generateKeyPair();
            
            // Store key pair in session
            dhRatchets.put(sessionId, dhKeyPair);
            
            return sessionId;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to initialize Double Ratchet session", e);
        }
    }
    
    /**
     * Get the public key for a session to share with recipient
     * @param sessionId Session ID
     * @return Base64 encoded public key
     */
    public String getPublicKey(String sessionId) {
        KeyPair keyPair = dhRatchets.get(sessionId);
        if (keyPair == null) {
            throw new IllegalArgumentException("Invalid session ID");
        }
        
        return Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());
    }
    
    /**
     * Process a received public key and establish shared secret
     * @param sessionId Session ID
     * @param encodedPublicKey Base64 encoded public key received from other party
     * @return true if successful
     */
    public boolean processPublicKey(String sessionId, String encodedPublicKey) {
        try {
            KeyPair keyPair = dhRatchets.get(sessionId);
            if (keyPair == null) {
                throw new IllegalArgumentException("Invalid session ID");
            }
            
            // Decode received public key
            byte[] publicKeyBytes = Base64.getDecoder().decode(encodedPublicKey);
            KeyFactory kf = KeyFactory.getInstance("EC");
            PublicKey publicKey = kf.generatePublic(new java.security.spec.X509EncodedKeySpec(publicKeyBytes));
            
            // Generate shared secret with DH
            KeyAgreement keyAgreement = KeyAgreement.getInstance("ECDH");
            keyAgreement.init(keyPair.getPrivate());
            keyAgreement.doPhase(publicKey, true);
            byte[] sharedSecret = keyAgreement.generateSecret();
            
            // Store root key
            rootKeys.put(sessionId, sharedSecret);
            
            // Generate initial chain key
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] chainKey = digest.digest(sharedSecret);
            chainKeys.put(sessionId, chainKey);
            
            // Generate new DH key pair for next ratchet step
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("EC");
            keyGen.initialize(256);
            KeyPair newDhKeyPair = keyGen.generateKeyPair();
            dhRatchets.put(sessionId, newDhKeyPair);
            
            return true;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process public key", e);
        }
    }
    
    /**
     * Generate a message key for encryption
     * @param sessionId Session ID
     * @return Secret key for message encryption
     */
    public SecretKey getMessageKey(String sessionId) {
        try {
            byte[] chainKey = chainKeys.get(sessionId);
            if (chainKey == null) {
                throw new IllegalArgumentException("No chain key found for session");
            }
            
            // Generate message key from chain key
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] messageKeyBytes = digest.digest(append(chainKey, new byte[]{1}));
            
            // Update chain key (ratchet forward)
            chainKeys.put(sessionId, digest.digest(append(chainKey, new byte[]{2})));
            
            // Create AES key from message key bytes
            return new SecretKeySpec(messageKeyBytes, 0, 32, "AES");
            
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to generate message key", e);
        }
    }
    
    /**
     * Helper method to append two byte arrays
     */
    private byte[] append(byte[] a, byte[] b) {
        byte[] result = new byte[a.length + b.length];
        System.arraycopy(a, 0, result, 0, a.length);
        System.arraycopy(b, 0, result, a.length, b.length);
        return result;
    }
}
