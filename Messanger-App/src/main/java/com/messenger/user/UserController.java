package com.messenger.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for user-related endpoints
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    
    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    /**
     * Get all users (excluding sensitive information)
     * @return List of user DTOs
     */
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserDTO> userDTOs = users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDTOs);
    }
    
    /**
     * Get a user by ID
     * @param id User ID
     * @return User DTO or 404
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return userService.findById(id)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get current authenticated user
     * @return User DTO
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        return userService.findByUsername(username)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Update user's online status
     * @param status Status information
     * @return Success response
     */
    @PostMapping("/status")
    public ResponseEntity<?> updateUserStatus(@RequestBody Map<String, Boolean> status) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        userService.findByUsername(username).ifPresent(user -> {
            userService.updateOnlineStatus(user.getId(), status.get("online"));
        });
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Check if username exists
     * @param username Username to check
     * @return Exists status
     */
    @GetMapping("/exists/username/{username}")
    public ResponseEntity<Map<String, Boolean>> checkUsernameExists(@PathVariable String username) {
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", userService.existsByUsername(username));
        return ResponseEntity.ok(response);
    }
    
    /**
     * Check if email exists
     * @param email Email to check
     * @return Exists status
     */
    @GetMapping("/exists/email/{email}")
    public ResponseEntity<Map<String, Boolean>> checkEmailExists(@PathVariable String email) {
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", userService.existsByEmail(email));
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get all users except the currently authenticated user
     * @param authentication Spring Security authentication object
     * @return List of user DTOs excluding the current user
     */
    @GetMapping("/discover")
    public ResponseEntity<List<UserDTO>> discoverUsers(Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        List<User> users = userService.getAllUsersExcept(currentUser.getId());
        List<UserDTO> userDTOs = users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDTOs);
    }
    
    /**
     * Test endpoint for discovering users without authentication
     * For development use only
     */
    @GetMapping("/discover-test")
    public ResponseEntity<List<UserDTO>> discoverUsersTest() {
        // Get all users
        List<User> users = userService.getAllUsers();
        // If there's at least one user, exclude the first one (simulating current user)
        List<User> filteredUsers = users.isEmpty() ? users : 
                                  users.stream()
                                      .filter(user -> !user.getId().equals(users.get(0).getId()))
                                      .collect(Collectors.toList());
        
        List<UserDTO> userDTOs = filteredUsers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDTOs);
    }
    
    /**
     * Convert User entity to UserDTO
     * @param user User entity
     * @return User DTO
     */
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setOnline(user.isOnline());
        dto.setLastActive(user.getLastActive());
        dto.setPublicKey(user.getPublicKey());
        dto.setRegistrationDate(user.getRegistrationDate());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());
        return dto;
    }
}
