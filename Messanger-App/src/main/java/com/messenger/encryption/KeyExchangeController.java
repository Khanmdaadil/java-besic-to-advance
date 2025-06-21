package com.messenger.encryption;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/encryption/key-exchange")
public class KeyExchangeController {

    private final DoubleRatchetService doubleRatchetService;
    
    @Autowired
    public KeyExchangeController(DoubleRatchetService doubleRatchetService) {
        this.doubleRatchetService = doubleRatchetService;
    }
    
    /**
     * Initialize a new key exchange session
     * @return Session ID and public key
     */
    @PostMapping("/init")
    public ResponseEntity<Map<String, String>> initKeyExchange() {
        String sessionId = doubleRatchetService.initSession();
        String publicKey = doubleRatchetService.getPublicKey(sessionId);
        
        Map<String, String> response = new HashMap<>();
        response.put("sessionId", sessionId);
        response.put("publicKey", publicKey);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Process a received public key and complete key exchange
     * @param request Contains sessionId and publicKey from other party
     * @return New public key for next ratchet
     */
    @PostMapping("/complete")
    public ResponseEntity<Map<String, String>> completeKeyExchange(@RequestBody KeyExchangeRequest request) {
        boolean success = doubleRatchetService.processPublicKey(
                request.getSessionId(), 
                request.getPublicKey()
        );
        
        // Get the next public key after ratchet
        String newPublicKey = doubleRatchetService.getPublicKey(request.getSessionId());
        
        Map<String, String> response = new HashMap<>();
        response.put("success", String.valueOf(success));
        response.put("sessionId", request.getSessionId());
        response.put("publicKey", newPublicKey);
        
        return ResponseEntity.ok(response);
    }
    
    // Simple request class for key exchange
    static class KeyExchangeRequest {
        private String sessionId;
        private String publicKey;
        
        public String getSessionId() {
            return sessionId;
        }
        
        public void setSessionId(String sessionId) {
            this.sessionId = sessionId;
        }
        
        public String getPublicKey() {
            return publicKey;
        }
        
        public void setPublicKey(String publicKey) {
            this.publicKey = publicKey;
        }
    }
}
