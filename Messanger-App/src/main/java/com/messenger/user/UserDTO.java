package com.messenger.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for User
 * Used to send user data to the client without sensitive information like passwords
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String publicKey;
    private LocalDateTime lastActive;
    private boolean online;
    private LocalDateTime registrationDate;
    private String profilePictureUrl;
}
