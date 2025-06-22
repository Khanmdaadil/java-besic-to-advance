package com.messenger.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * User entity representing application users
 */
@Data
@Entity
@Table(name = "app_users")
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(name = "public_key", length = 2048)
    private String publicKey;
    
    @Column(name = "last_active")
    private LocalDateTime lastActive;
    
    @Column(name = "online_status")
    private boolean online;
    
    @Column(name = "registration_date", nullable = false)
    private LocalDateTime registrationDate;
    
    @Column(name = "profile_picture_url")
    private String profilePictureUrl;
    
    @PrePersist
    protected void onCreate() {
        registrationDate = LocalDateTime.now();
    }
}
