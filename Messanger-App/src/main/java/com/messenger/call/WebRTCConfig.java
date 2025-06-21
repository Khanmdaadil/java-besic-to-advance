package com.messenger.call;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

/**
 * WebRTC configuration for STUN/TURN servers
 * This provides ice servers configuration for WebRTC clients
 */
@Configuration
public class WebRTCConfig {

    @Value("${webrtc.stun.urls:stun:stun.l.google.com:19302}")
    private String stunUrls;

    @Value("${webrtc.turn.urls:}")
    private String turnUrls;

    @Value("${webrtc.turn.username:}")
    private String turnUsername;

    @Value("${webrtc.turn.credential:}")
    private String turnCredential;

    /**
     * Provides ICE server configuration for WebRTC clients
     * @return List of ICE server configurations (STUN/TURN)
     */
    @Bean
    public List<Map<String, Object>> iceServers() {
        List<Map<String, Object>> iceServers = new ArrayList<>();
        
        // Add STUN servers
        String[] stunServerUrls = stunUrls.split(",");
        Map<String, Object> stunServer = new HashMap<>();
        stunServer.put("urls", stunServerUrls);
        iceServers.add(stunServer);
        
        // Add TURN servers if configured
        if (!turnUrls.isEmpty()) {
            String[] turnServerUrls = turnUrls.split(",");
            Map<String, Object> turnServer = new HashMap<>();
            turnServer.put("urls", turnServerUrls);
            
            if (!turnUsername.isEmpty()) {
                turnServer.put("username", turnUsername);
            }
            
            if (!turnCredential.isEmpty()) {
                turnServer.put("credential", turnCredential);
            }
            
            iceServers.add(turnServer);
        }
        
        return iceServers;
    }
}
