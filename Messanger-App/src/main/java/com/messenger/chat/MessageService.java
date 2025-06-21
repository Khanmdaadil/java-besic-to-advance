package com.messenger.chat;

import com.messenger.friendship.FriendshipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for managing chat messages
 */
@Service
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final FriendshipService friendshipService;
    
    @Autowired
    public MessageService(MessageRepository messageRepository, FriendshipService friendshipService) {
        this.messageRepository = messageRepository;
        this.friendshipService = friendshipService;
    }
    
    /**
     * Save a new message, only if users are friends
     * @param message Message object
     * @return Saved message
     * @throws IllegalArgumentException if users aren't friends
     */
    public Message saveMessage(Message message) {
        // Check if users are friends before allowing message to be sent
        if (!canSendMessage(message.getSenderId(), message.getRecipientId())) {
            throw new IllegalArgumentException("Cannot send message: users are not friends");
        }
        return messageRepository.save(message);
    }
    
    /**
     * Get a message by its ID
     * @param messageId Message ID
     * @return Message if found, null otherwise
     */
    public Message getMessageById(Long messageId) {
        return messageRepository.findById(messageId).orElse(null);
    }
    
    /**
     * Check if a user can send a message to another user
     * @param senderId The sender's ID
     * @param recipientId The recipient's ID
     * @return true if the message can be sent, false otherwise
     */
    public boolean canSendMessage(Long senderId, Long recipientId) {
        return friendshipService.areFriends(senderId, recipientId);
    }
    
    /**
     * Find messages between two users
     * @param user1Id First user ID
     * @param user2Id Second user ID
     * @return List of messages
     */
    public List<Message> getMessagesBetweenUsers(Long user1Id, Long user2Id) {
        return messageRepository.findMessagesBetweenUsers(user1Id, user2Id);
    }
    
    /**
     * Get unread messages for a user
     * @param userId User ID
     * @return List of unread messages
     */
    public List<Message> getUnreadMessages(Long userId) {
        return messageRepository.findByRecipientIdAndReadFalseOrderByTimestampDesc(userId);
    }
    
    /**
     * Mark message as read
     * @param messageId Message ID
     */
    public void markAsRead(Long messageId) {
        messageRepository.findById(messageId).ifPresent(message -> {
            message.setRead(true);
            messageRepository.save(message);
        });
    }
    
    /**
     * Set self-destruct timer for a message
     * @param messageId Message ID
     * @param minutes Minutes until self-destruction
     */
    public void setSelfDestructTimer(Long messageId, int minutes) {
        messageRepository.findById(messageId).ifPresent(message -> {
            message.setSelfDestructTime(LocalDateTime.now().plusMinutes(minutes));
            messageRepository.save(message);
        });
    }
    
    /**
     * Delete messages that should self-destruct
     * Runs every minute
     */
    @Scheduled(fixedRate = 60000)
    public void processSelfDestructMessages() {
        List<Message> expiredMessages = 
            messageRepository.findBySelfDestructTimeBeforeAndSelfDestructTimeNotNull(LocalDateTime.now());
        
        for (Message message : expiredMessages) {
            messageRepository.delete(message);
        }
    }
}
