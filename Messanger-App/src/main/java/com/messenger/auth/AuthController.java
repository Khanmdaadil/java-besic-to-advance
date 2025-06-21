package com.messenger.auth;

import com.messenger.user.User;
import com.messenger.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for authentication endpoints
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    /**
     * Login endpoint
     * @param authRequest Login credentials
     * @return JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        try {
            Authentication authenticate = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
            );
            
            UserDetails userDetails = (UserDetails) authenticate.getPrincipal();
            String token = jwtUtil.generateToken(userDetails);
            
            User user = userService.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            userService.updateOnlineStatus(user.getId(), true);
            
            return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getUsername()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }
    }
    
    /**
     * Registration endpoint
     * @param registerRequest Registration details
     * @return Response with status
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        Map<String, String> response = new HashMap<>();
        
        // Check if username exists
        if (userService.existsByUsername(registerRequest.getUsername())) {
            response.put("error", "Username is already taken");
            return ResponseEntity.badRequest().body(response);
        }
        
        // Check if email exists
        if (userService.existsByEmail(registerRequest.getEmail())) {
            response.put("error", "Email is already in use");
            return ResponseEntity.badRequest().body(response);
        }
        
        // Create user
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(registerRequest.getPassword());
        user.setPublicKey(registerRequest.getPublicKey());
        
        userService.createUser(user);
        
        response.put("message", "User registered successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Logout endpoint
     * @param authRequest User credentials
     * @return Response with status
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody AuthRequest authRequest) {
        User user = userService.findByUsername(authRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        userService.updateOnlineStatus(user.getId(), false);
        
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
