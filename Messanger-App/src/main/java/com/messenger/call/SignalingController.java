package com.messenger.call;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * WebSocket controller for WebRTC signaling
 */
@Controller
public class SignalingController {
    
    private final SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    public SignalingController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * Handle WebRTC offer signal
     * @param payload The offer signal payload
     */
    @MessageMapping("/call.offer")
    public void handleOffer(@Payload Map<String, Object> payload) {
        String targetUserId = (String) payload.get("targetUserId");
        
        // Forward the offer to the target user
        messagingTemplate.convertAndSendToUser(
                targetUserId,
                "/queue/webrtc",
                payload
        );
    }
    
    /**
     * Handle WebRTC answer signal
     * @param payload The answer signal payload
     */
    @MessageMapping("/call.answer")
    public void handleAnswer(@Payload Map<String, Object> payload) {
        String targetUserId = (String) payload.get("targetUserId");
        
        // Forward the answer to the target user
        messagingTemplate.convertAndSendToUser(
                targetUserId,
                "/queue/webrtc",
                payload
        );
    }
    
    /**
     * Handle WebRTC ICE candidate signal
     * @param payload The ICE candidate payload
     */
    @MessageMapping("/call.ice")
    public void handleIceCandidate(@Payload Map<String, Object> payload) {
        String targetUserId = (String) payload.get("targetUserId");
        
        // Forward the ICE candidate to the target user
        messagingTemplate.convertAndSendToUser(
                targetUserId,
                "/queue/webrtc",
                payload
        );
    }
    
    /**
     * Handle call hang up signal
     * @param payload The hang up payload
     */
    @MessageMapping("/call.hangup")
    public void handleHangup(@Payload Map<String, Object> payload) {
        String targetUserId = (String) payload.get("targetUserId");
        
        // Forward the hang up to the target user
        messagingTemplate.convertAndSendToUser(
                targetUserId,
                "/queue/webrtc",
                payload
        );
    }
}
