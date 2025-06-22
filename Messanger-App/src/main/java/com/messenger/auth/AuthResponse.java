package com.messenger.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Authentication response DTO containing JWT token
 */
@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long userId;
    private String username;
}
