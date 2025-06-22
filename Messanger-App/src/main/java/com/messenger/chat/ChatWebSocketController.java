package com.messenger.chat;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * WebSocket controller for handling real-time message exchange
 */
@Controller
public class ChatWebSocketController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    
    @Autowired
    public ChatWebSocketController(SimpMessagingTemplate messagingTemplate, MessageService messageService) {
        this.messagingTemplate = messagingTemplate;
        this.messageService = messageService;
    }
    
    /**
     * Handle private message sent between users
     * @param message The message object
     */
    @MessageMapping("/chat.send")
    public void sendPrivateMessage(@Payload Message message) {
        // Save the message to the database
        Message savedMessage = messageService.saveMessage(message);
        
        // Send the message to the recipient's private queue
        messagingTemplate.convertAndSendToUser(
                String.valueOf(message.getRecipientId()),
                "/queue/messages",
                savedMessage
        );
    }
    
    /**
     * Handle read receipt notifications
     * @param readReceipt Contains the messageId that was read
     */
    @MessageMapping("/chat.read")
    public void markMessageAsRead(@Payload ReadReceipt readReceipt) {
        // Mark message as read in database
        messageService.markAsRead(readReceipt.getMessageId());
        
        // Notify the sender that the message was read
        messagingTemplate.convertAndSendToUser(
                String.valueOf(readReceipt.getSenderId()),
                "/queue/receipts",
                readReceipt
        );
    }
    
    /**
     * Inner class for read receipts
     */
    static class ReadReceipt {
        private Long messageId;
        private Long senderId;
        private Long recipientId;
        
        // Getters and setters
        public Long getMessageId() {
            return messageId;
        }
        
        public void setMessageId(Long messageId) {
            this.messageId = messageId;
        }
        
        public Long getSenderId() {
            return senderId;
        }
        
        public void setSenderId(Long senderId) {
            this.senderId = senderId;
        }
        
        public Long getRecipientId() {
            return recipientId;
        }
        
        public void setRecipientId(Long recipientId) {
            this.recipientId = recipientId;
        }
    }
}
