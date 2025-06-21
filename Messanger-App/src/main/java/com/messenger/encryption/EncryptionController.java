package com.messenger.encryption;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.security.KeyPair;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for handling encryption key generation and exchange
 */
@RestController
@RequestMapping("/api/encryption")
public class EncryptionController {

    private final EncryptionService encryptionService;
    private final DoubleRatchetService doubleRatchetService;

    @Autowired
    public EncryptionController(EncryptionService encryptionService, DoubleRatchetService doubleRatchetService) {
        this.encryptionService = encryptionService;
        this.doubleRatchetService = doubleRatchetService;
    }

    /**
     * Generate and return a new AES key for symmetric encryption
     *
     * @return A Base64 encoded AES key
     */
    @GetMapping("/key/symmetric")
    public Map<String, String> generateSymmetricKey() {
        Map<String, String> response = new HashMap<>();
        try {
            String key = encryptionService.generateAESKey();
            response.put("key", key);
            response.put("algorithm", "AES-256-GCM");
        } catch (Exception e) {
            response.put("error", e.getMessage());
        }
        return response;
    }

    /**
     * Generate and return a new RSA key pair for asymmetric encryption
     *
     * @return Public and private keys, Base64 encoded
     */
    @GetMapping("/key/asymmetric")
    public Map<String, String> generateAsymmetricKeyPair() {
        Map<String, String> response = new HashMap<>();
        try {
            KeyPair keyPair = encryptionService.generateKeyPair();
            response.put("publicKey", encryptionService.keyToString(keyPair.getPublic()));
            response.put("privateKey", encryptionService.keyToString(keyPair.getPrivate()));
            response.put("algorithm", "RSA-2048");
        } catch (Exception e) {
            response.put("error", e.getMessage());
        }
        return response;
    }

    /**
     * Get public key for key exchange
     *
     * @param sessionId Session ID for the ratchet
     * @return Base64 encoded public key
     */
    @GetMapping("/public-key/{sessionId}")
    public ResponseEntity<Map<String, String>> getPublicKey(@PathVariable String sessionId) {
        String publicKey = doubleRatchetService.getPublicKey(sessionId);

        Map<String, String> response = new HashMap<>();
        response.put("publicKey", publicKey);

        return ResponseEntity.ok(response);
    }

    /**
     * Get a message key for encryption/decryption
     *
     * @param request The session ID
     * @return Base64 encoded message key
     */
    @PostMapping("/message-key")
    public ResponseEntity<Map<String, String>> getMessageKey(@RequestBody MessageKeyRequest request) {
        SecretKey messageKey = doubleRatchetService.getMessageKey(request.getSessionId());
        String encodedKey = Base64.getEncoder().encodeToString(messageKey.getEncoded());

        Map<String, String> response = new HashMap<>();
        response.put("key", encodedKey);

        return ResponseEntity.ok(response);
    }

    // Simple request class for message key generation
    static class MessageKeyRequest {
        private String sessionId;

        public String getSessionId() {
            return sessionId;
        }

        public void setSessionId(String sessionId) {
            this.sessionId = sessionId;
        }
    }
}
