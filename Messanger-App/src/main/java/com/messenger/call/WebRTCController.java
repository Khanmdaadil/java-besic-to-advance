package com.messenger.call;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Controller for WebRTC configuration
 */
@RestController
@RequestMapping("/api/webrtc")
public class WebRTCController {

    private final List<Map<String, Object>> iceServers;

    @Autowired
    public WebRTCController(List<Map<String, Object>> iceServers) {
        this.iceServers = iceServers;
    }

    /**
     * Get ICE server configuration for WebRTC
     * @return List of ICE server configurations
     */
    @GetMapping("/ice-servers")
    public ResponseEntity<List<Map<String, Object>>> getIceServers() {
        return ResponseEntity.ok(iceServers);
    }
}
