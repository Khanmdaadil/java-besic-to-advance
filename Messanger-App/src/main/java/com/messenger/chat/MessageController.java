package com.messenger.chat;

import com.messenger.user.User;
import com.messenger.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for message operations
 */
@RestController
@RequestMapping("/api/messages")
public class MessageController {
    
    private final MessageService messageService;
    private final UserService userService;
    
    @Autowired
    public MessageController(MessageService messageService, UserService userService) {
        this.messageService = messageService;
        this.userService = userService;
    }
    
    /**
     * Get messages between current user and another user
     * Only returns messages if users are friends
     * @param otherUserId Other user ID
     * @param authentication Current user's authentication
     * @return List of messages or error if not friends
     */
    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<?> getConversation(
            @PathVariable Long otherUserId,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName());
        
        // Check if users are friends
        if (!messageService.canSendMessage(currentUser.getId(), otherUserId)) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Cannot access messages: users are not friends");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        List<Message> messages = messageService.getMessagesBetweenUsers(currentUser.getId(), otherUserId);
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Get unread messages for current user
     * @param authentication Current user's authentication
     * @return List of unread messages
     */
    @GetMapping("/unread")
    public ResponseEntity<List<Message>> getUnreadMessages(Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        List<Message> messages = messageService.getUnreadMessages(currentUser.getId());
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Send a new message
     * @param messageRequest Message data from request body
     * @param authentication Current user's authentication
     * @return Saved message or error if not friends
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(
            @RequestBody MessageRequest messageRequest,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName());
        
        // Create message entity
        Message message = new Message();
        message.setSenderId(currentUser.getId());
        message.setRecipientId(messageRequest.getRecipientId());
        message.setContent(messageRequest.getContent());
        
        try {
            Message savedMessage = messageService.saveMessage(message);
            return ResponseEntity.ok(savedMessage);
        } catch (IllegalArgumentException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Mark a message as read
     * @param messageId Message ID
     * @param authentication Current user's authentication
     * @return Response status
     */
    @PutMapping("/{messageId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long messageId,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName());
        
        // Check if the message belongs to the current user
        Message message = messageService.getMessageById(messageId);
        if (message == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Check if current user is the recipient
        if (!message.getRecipientId().equals(currentUser.getId())) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "You can only mark your own messages as read");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        messageService.markAsRead(messageId);
        return ResponseEntity.ok(Map.of("status", "Message marked as read"));
    }
    
    /**
     * Set self-destruct timer for a message
     * @param messageId Message ID
     * @param minutes Minutes until self-destruction
     * @param authentication Current user's authentication
     * @return Response status
     */
    @PutMapping("/{messageId}/self-destruct")
    public ResponseEntity<?> setSelfDestructTimer(
            @PathVariable Long messageId,
            @RequestParam int minutes,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName());
        
        // Check if the message belongs to the current user
        Message message = messageService.getMessageById(messageId);
        if (message == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Check if current user is the sender
        if (!message.getSenderId().equals(currentUser.getId())) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "You can only set self-destruct for your own messages");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        messageService.setSelfDestructTimer(messageId, minutes);
        return ResponseEntity.ok(Map.of("status", "Self-destruct timer set"));
    }
}
