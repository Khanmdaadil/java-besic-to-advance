package com.messenger.file;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing a shared file
 */
@Data
@Entity
@Table(name = "shared_files")
@NoArgsConstructor
@AllArgsConstructor
public class SharedFile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "sender_id", nullable = false)
    private Long senderId;
    
    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;
    
    @Column(nullable = false)
    private String filename;
    
    @Column(nullable = false)
    private String path;
    
    @Column(nullable = false)
    private String contentType;
    
    @Column(name = "file_size", nullable = false)
    private Long size;
    
    @Column(name = "upload_time", nullable = false)
    private LocalDateTime uploadTime;
    
    @Column(name = "is_encrypted")
    private boolean encrypted;
    
    @PrePersist
    protected void onCreate() {
        uploadTime = LocalDateTime.now();
    }
}
