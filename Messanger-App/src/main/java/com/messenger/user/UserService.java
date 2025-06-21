package com.messenger.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing users
 */
@Service
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    /**
     * Create a new user
     * @param user User entity to create
     * @return Created user
     */
    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setOnline(true);
        user.setLastActive(LocalDateTime.now());
        return userRepository.save(user);
    }
    
    /**
     * Find user by username
     * @param username Username to search for
     * @return Optional containing the user if found
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    /**
     * Find user by email
     * @param email Email to search for
     * @return Optional containing the user if found
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * Find user by ID
     * @param id User ID to search for
     * @return Optional containing the user if found
     */
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    /**
     * Check if username exists
     * @param username Username to check
     * @return True if exists
     */
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
    
    /**
     * Check if email exists
     * @param email Email to check
     * @return True if exists
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
    
    /**
     * Get all users
     * @return List of all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    /**
     * Get all users except the one with the given ID
     * @param currentUserId ID of user to exclude
     * @return List of all users except the current user
     */
    public List<User> getAllUsersExcept(Long currentUserId) {
        return userRepository.findByIdNot(currentUserId);
    }
    
    /**
     * Update user's online status
     * @param userId User ID
     * @param online Online status
     */
    public void updateOnlineStatus(Long userId, boolean online) {
        Optional<User> userOpt = userRepository.findById(userId);
        userOpt.ifPresent(user -> {
            user.setOnline(online);
            user.setLastActive(LocalDateTime.now());
            userRepository.save(user);
        });
    }
    
    /**
     * Update user's public key
     * @param userId User ID
     * @param publicKey Public key string
     */
    public void updatePublicKey(Long userId, String publicKey) {
        Optional<User> userOpt = userRepository.findById(userId);
        userOpt.ifPresent(user -> {
            user.setPublicKey(publicKey);
            userRepository.save(user);
        });
    }
    
    /**
     * Get user by username
     * @param username Username to search for
     * @return User or throws exception if not found
     */
    public User getUserByUsername(String username) {
        return findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }
}
