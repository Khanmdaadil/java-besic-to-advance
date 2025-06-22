package com.messenger.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for Message entity operations
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    /**
     * Find all messages between two users
     * @param user1Id First user ID
     * @param user2Id Second user ID
     * @return List of messages
     */
    @Query("SELECT m FROM Message m WHERE " +
            "(m.senderId = ?1 AND m.recipientId = ?2) OR " +
            "(m.senderId = ?2 AND m.recipientId = ?1) " +
            "ORDER BY m.timestamp ASC")
    List<Message> findMessagesBetweenUsers(Long user1Id, Long user2Id);
    
    /**
     * Find all messages sent to a user
     * @param userId User ID
     * @return List of messages
     */
    List<Message> findByRecipientIdOrderByTimestampDesc(Long userId);
    
    /**
     * Find all unread messages sent to a user
     * @param userId User ID
     * @return List of messages
     */
    List<Message> findByRecipientIdAndReadFalseOrderByTimestampDesc(Long userId);
    
    /**
     * Find messages that should self-destruct
     * @param now Current time
     * @return List of messages
     */
    List<Message> findBySelfDestructTimeBeforeAndSelfDestructTimeNotNull(LocalDateTime now);
}
