package com.messenger.chat;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time messaging
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    /**
     * Configure the message broker
     * @param registry MessageBrokerRegistry
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable a simple memory-based message broker to send messages to clients
        // on destinations prefixed with /topic and /queue
        registry.enableSimpleBroker("/topic", "/queue");
        
        // Define the prefix for messages from clients to the application
        registry.setApplicationDestinationPrefixes("/app");
        
        // Define the prefix for user-specific destinations
        registry.setUserDestinationPrefix("/user");
    }
    
    /**
     * Register STOMP endpoints
     * @param registry StompEndpointRegistry
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the "/ws" endpoint for WebSocket connections with enhanced CORS support
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Configure CORS for WebSocket connections - don't use setAllowedOrigins with "*" if using setAllowCredentials
                .withSockJS()
                .setClientLibraryUrl("https://cdn.jsdelivr.net/npm/sockjs-client@1.6.1/dist/sockjs.min.js")
                .setSessionCookieNeeded(false) // Don't require cookies for SockJS fallbacks
                .setDisconnectDelay(30 * 1000) // 30 seconds
                .setHeartbeatTime(25 * 1000); // 25 seconds
    }
}
