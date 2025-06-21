package com.messenger.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing a chat message
 */
@Data
@Entity
@Table(name = "messages")
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "sender_id", nullable = false)
    private Long senderId;
    
    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;
    
    @Column(nullable = false, length = 10000)
    private String content;
    
    @Column(name = "is_encrypted", nullable = false)
    private boolean encrypted;
    
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
    
    @Column(name = "is_read")
    private boolean read;
    
    @Column(name = "self_destruct_time")
    private LocalDateTime selfDestructTime;
    
    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
