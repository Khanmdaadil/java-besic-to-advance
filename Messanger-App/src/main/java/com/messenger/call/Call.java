package com.messenger.call;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing a call between users
 */
@Data
@Entity
@Table(name = "calls")
@NoArgsConstructor
@AllArgsConstructor
public class Call {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "caller_id", nullable = false)
    private Long callerId;
    
    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;
    
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CallType type;
    
    @Column
    @Enumerated(EnumType.STRING)
    private CallStatus status;
    
    /**
     * Enum for call types
     */
    public enum CallType {
        AUDIO, VIDEO
    }
    
    /**
     * Enum for call status
     */
    public enum CallStatus {
        RINGING, ONGOING, COMPLETED, MISSED, REJECTED
    }
    
    @PrePersist
    protected void onCreate() {
        startTime = LocalDateTime.now();
    }
}
