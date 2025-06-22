package com.messenger.friendship;

import com.messenger.chat.WebSocketConfig;
import com.messenger.user.User;
import com.messenger.user.UserDTO;
import com.messenger.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/friendships")
public class FriendshipController {
    
    private final FriendshipService friendshipService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    public FriendshipController(FriendshipService friendshipService, 
                               UserService userService,
                               SimpMessagingTemplate messagingTemplate) {
        this.friendshipService = friendshipService;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * Convert Friendship entity to DTO
     */
    private FriendshipDTO convertToDTO(Friendship friendship) {
        FriendshipDTO dto = new FriendshipDTO();
        dto.setId(friendship.getId());
        
        UserDTO requesterDTO = new UserDTO();
        requesterDTO.setId(friendship.getRequester().getId());
        requesterDTO.setUsername(friendship.getRequester().getUsername());
        requesterDTO.setEmail(friendship.getRequester().getEmail());
        requesterDTO.setProfilePictureUrl(friendship.getRequester().getProfilePictureUrl());
        requesterDTO.setOnline(friendship.getRequester().isOnline());
        
        UserDTO addresseeDTO = new UserDTO();
        addresseeDTO.setId(friendship.getAddressee().getId());
        addresseeDTO.setUsername(friendship.getAddressee().getUsername());
        addresseeDTO.setEmail(friendship.getAddressee().getEmail());
        addresseeDTO.setProfilePictureUrl(friendship.getAddressee().getProfilePictureUrl());
        addresseeDTO.setOnline(friendship.getAddressee().isOnline());
        
        dto.setRequester(requesterDTO);
        dto.setAddressee(addresseeDTO);
        dto.setStatus(friendship.getStatus().name());
        dto.setCreatedAt(friendship.getCreatedAt());
        dto.setUpdatedAt(friendship.getUpdatedAt());
        
        return dto;
    }
    
    /**
     * Get all accepted friends for the authenticated user
     */
    @GetMapping("/friends")
    public ResponseEntity<List<FriendshipDTO>> getFriends(Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        List<Friendship> friendships = friendshipService.getUserFriendships(currentUser.getId());

        List<FriendshipDTO> friendshipDTOs = friendships.stream()
                // Filter only accepted friendships
                .filter(friendship -> friendship.getStatus() == Friendship.Status.ACCEPTED)
                .map(this::convertToDTO)
                .map(dto -> {
                    // Only show the other user's info (not the current user)
                    if (dto.getRequester() != null && dto.getRequester().getId().equals(currentUser.getId())) {
                        dto.setRequester(null);
                    }
                    if (dto.getAddressee() != null && dto.getAddressee().getId().equals(currentUser.getId())) {
                        dto.setAddressee(null);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(friendshipDTOs);
    }
    
    /**
     * Get pending friend requests for the authenticated user
     * Only the recipient of the friend request can see these requests
     */
    @GetMapping("/pending")
    public ResponseEntity<List<FriendshipDTO>> getPendingRequests(Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        List<Friendship> friendships = friendshipService.getPendingFriendRequests(currentUser.getId());
        
        // Security check: Only return requests where the current user is the addressee
        List<FriendshipDTO> friendshipDTOs = friendships.stream()
                .filter(friendship -> friendship.getAddressee().getId().equals(currentUser.getId()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(friendshipDTOs);
    }
    
    /**
     * Get outgoing friend requests from the authenticated user
     * Only the sender can see their outgoing requests
     */
    @GetMapping("/outgoing")
    public ResponseEntity<List<FriendshipDTO>> getOutgoingRequests(Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        List<Friendship> friendships = friendshipService.getOutgoingFriendRequests(currentUser.getId());
        
        // Security check: Only return requests where the current user is the requester
        List<FriendshipDTO> friendshipDTOs = friendships.stream()
                .filter(friendship -> friendship.getRequester().getId().equals(currentUser.getId()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(friendshipDTOs);
    }
    
    /**
     * Send a friend request
     * Users can send friend requests to any user except themselves.
     */
    @PostMapping("/request/{addresseeId}")
    public ResponseEntity<?> sendFriendRequest(
            @PathVariable Long addresseeId,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        
        // Prevent users from sending friend requests to themselves
        if (currentUser.getId().equals(addresseeId)) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "You cannot send a friend request to yourself");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        // Check if friendship already exists or is pending
        if (friendshipService.friendshipExists(currentUser.getId(), addresseeId)) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "A friendship or request already exists with this user");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        // Check if addressee user exists
        if (!userService.findById(addresseeId).isPresent()) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "User not found");
            return ResponseEntity.notFound().build();
        }
        
        // Send the friend request
        Friendship friendship = friendshipService.sendFriendRequest(currentUser.getId(), addresseeId);
        
        // Notify the addressee about the new friend request via WebSocket
        User addressee = friendship.getAddressee();
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "FRIEND_REQUEST");
        notification.put("friendship", convertToDTO(friendship));
        
        messagingTemplate.convertAndSendToUser(
                addressee.getUsername(),
                "/queue/notifications",
                notification
        );
        
        return ResponseEntity.ok(convertToDTO(friendship));
    }
    
    /**
     * Accept a friend request
     * Only the addressee (recipient) of the friend request can accept it
     */
    @PostMapping("/{id}/accept")
    public ResponseEntity<FriendshipDTO> acceptFriendRequest(
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        
        // First get friendship to verify the current user is the addressee
        Optional<Friendship> friendshipOptional = friendshipService.getFriendshipById(id);
        
        if (!friendshipOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Friendship existingFriendship = friendshipOptional.get();
        
        // Verify the current user is the addressee (recipient) of the request
        if (!existingFriendship.getAddressee().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(null); // Unauthorized - only the addressee can accept
        }
        
        // Verify the status is PENDING
        if (!existingFriendship.getStatus().equals(Friendship.Status.PENDING)) {
            return ResponseEntity.badRequest().body(null); // Cannot accept a non-pending request
        }
        
        // Accept the friend request
        Friendship friendship = friendshipService.acceptFriendRequest(id, currentUser.getId());
        
        // Notify requester that their friend request was accepted
        User requester = friendship.getRequester();
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "FRIEND_ACCEPTED");
        notification.put("friendship", convertToDTO(friendship));
        
        messagingTemplate.convertAndSendToUser(
                requester.getUsername(),
                "/queue/notifications",
                notification
        );
        
        return ResponseEntity.ok(convertToDTO(friendship));
    }
    
    /**
     * Reject a friend request
     * Only the addressee (recipient) of the friend request can reject it
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<FriendshipDTO> rejectFriendRequest(
            @PathVariable Long id,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        
        // First get friendship to verify the current user is the addressee
        Optional<Friendship> friendshipOptional = friendshipService.getFriendshipById(id);
        
        if (!friendshipOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Friendship existingFriendship = friendshipOptional.get();
        
        // Verify the current user is the addressee (recipient) of the request
        if (!existingFriendship.getAddressee().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(null); // Unauthorized - only addressee can reject
        }
        
        // Verify the status is PENDING
        if (!existingFriendship.getStatus().equals(Friendship.Status.PENDING)) {
            return ResponseEntity.badRequest().body(null); // Cannot reject a non-pending request
        }
        
        // Reject the friend request
        Friendship friendship = friendshipService.rejectFriendRequest(id, currentUser.getId());
        
        // Notify requester that their friend request was rejected (optional)
        User requester = friendship.getRequester();
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "FRIEND_REJECTED");
        notification.put("friendship", convertToDTO(friendship));
        
        messagingTemplate.convertAndSendToUser(
                requester.getUsername(),
                "/queue/notifications",
                notification
        );
        
        return ResponseEntity.ok(convertToDTO(friendship));
    }
    
    /**
     * Check friendship status between the authenticated user and another user
     * Returns detailed information about the friendship status
     */
    @GetMapping("/check/{userId}")
    public ResponseEntity<Map<String, Object>> checkFriendshipStatus(
            @PathVariable Long userId,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        
        // Prevent checking friendship with self
        if (currentUser.getId().equals(userId)) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "SELF");
            response.put("message", "Cannot check friendship status with yourself");
            return ResponseEntity.ok(response);
        }
        
        // Check if the specified user exists
        Optional<User> otherUserOpt = userService.findById(userId);
        if (!otherUserOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        boolean areFriends = friendshipService.areFriends(currentUser.getId(), userId);
        
        // Check if there's a pending request
        boolean hasPendingRequest = friendshipService.friendshipExists(currentUser.getId(), userId) && 
                                   !areFriends;
        
        // Get additional details about the friendship/request
        Optional<Friendship> friendshipOpt = friendshipService.findBetweenUsers(currentUser.getId(), userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("areFriends", areFriends);
        response.put("hasPendingRequest", hasPendingRequest);
        
        if (friendshipOpt.isPresent()) {
            Friendship friendship = friendshipOpt.get();
            response.put("status", friendship.getStatus().name());
            response.put("friendshipId", friendship.getId());
            response.put("isRequester", friendship.getRequester().getId().equals(currentUser.getId()));
            response.put("isAddressee", friendship.getAddressee().getId().equals(currentUser.getId()));
            response.put("createdAt", friendship.getCreatedAt());
            response.put("updatedAt", friendship.getUpdatedAt());
        } else {
            response.put("status", "NONE");
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test endpoint for getting outgoing friend requests (no auth)
     * For development use only
     */
    @GetMapping("/outgoing-test")
    public ResponseEntity<List<FriendshipDTO>> getOutgoingRequestsTest(@RequestParam(required = false) Long userId) {
        if (userId == null) {
            // If no user ID provided, return all outgoing requests
            return ResponseEntity.ok(testFriendshipsStore.get("outgoing"));
        }
        
        // Filter outgoing requests by the requester ID
        List<FriendshipDTO> filteredRequests = testFriendshipsStore.get("outgoing").stream()
            .filter(friendship -> friendship.getRequester().getId().equals(userId))
            .collect(Collectors.toList());
        
        System.out.println("Returning " + filteredRequests.size() + " outgoing requests for user ID: " + userId);
        return ResponseEntity.ok(filteredRequests);
    }
    
    /**
     * Test endpoint for getting pending friend requests (no auth)
     * For development use only
     */
    @GetMapping("/pending-test")
    public ResponseEntity<List<FriendshipDTO>> getPendingRequestsTest() {
        return ResponseEntity.ok(testFriendshipsStore.get("pending"));
    }
    
    /**
     * Test endpoint for getting friends (no auth)
     * For development use only
     */
    @GetMapping("/friends-test")
    public ResponseEntity<List<FriendshipDTO>> getFriendsTest(@RequestParam(required = false) Long userId) {
        try {
            Long currentUserId = null;
            
            // If userId is provided, use that; otherwise get the first user as default
            if (userId != null) {
                currentUserId = userId;
                System.out.println("Using provided user ID: " + userId);
            } else {
                // Get the first user from the database to simulate the current user
                User testUser = userService.getAllUsers().stream().findFirst().orElseThrow();
                currentUserId = testUser.getId();
                System.out.println("No user ID provided, using first user: " + currentUserId);
            }
            
            // Filter to only include friendships where the current user is involved
            List<FriendshipDTO> allFriendships = testFriendshipsStore.get("friends");
            // Create final copy of currentUserId for use in lambda
            final Long finalCurrentUserId = currentUserId;
            List<FriendshipDTO> userFriendships = allFriendships.stream()
                .filter(friendship -> 
                    friendship.getRequester().getId().equals(finalCurrentUserId) || 
                    friendship.getAddressee().getId().equals(finalCurrentUserId))
                .collect(Collectors.toList());
            
            System.out.println("Returning " + userFriendships.size() + " friendships for user ID: " + currentUserId);
            return ResponseEntity.ok(userFriendships);
        } catch (Exception e) {
            System.err.println("Error in getFriendsTest: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(testFriendshipsStore.get("friends"));
        }
    }
    
    /**
     * Test endpoint for sending a friend request (no auth)
     * For development use only
     */
    @PostMapping("/request-test/{addresseeId}")
    public ResponseEntity<FriendshipDTO> sendFriendRequestTest(
            @PathVariable Long addresseeId,
            @RequestBody(required = false) Map<String, Object> requestBody) {
        try {
            // Extract requester ID from request body if provided
            Long requesterId = null;
            if (requestBody != null && requestBody.containsKey("requesterId")) {
                requesterId = Long.valueOf(requestBody.get("requesterId").toString());
                System.out.println("Using provided requester ID: " + requesterId);
                
                // Explicitly check that user is not sending request to themselves
                if (requesterId.equals(addresseeId)) {
                    return ResponseEntity.badRequest().body(createErrorResponse("Cannot send friend request to yourself"));
                }
            }
            
            // If no requesterId provided, use the first user as a fallback
            User requester;
            if (requesterId != null) {
                // Create a final copy of requesterId for use in lambda
                final Long finalRequesterId = requesterId;
                requester = userService.findById(finalRequesterId)
                    .orElseThrow(() -> new IllegalArgumentException("Requester not found with ID: " + finalRequesterId));
            } else {
                requester = userService.getAllUsers().stream().findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("No users available to use as requester"));
                System.out.println("No requester ID provided, using first user: " + requester.getId());
            }
            
            // Get addressee
            User addressee = userService.findById(addresseeId)
                .orElseThrow(() -> new IllegalArgumentException("Addressee not found with ID: " + addresseeId));
            
            System.out.println("Processing friend request from " + requester.getUsername() + 
                " (ID: " + requester.getId() + ") to " + addressee.getUsername() + 
                " (ID: " + addressee.getId() + ")");
            
            // Check if request already exists from this requester to this addressee
            List<FriendshipDTO> existingOutgoing = testFriendshipsStore.get("outgoing");
            for (FriendshipDTO existing : existingOutgoing) {
                if (existing.getRequester().getId().equals(requester.getId()) && 
                    existing.getAddressee().getId().equals(addresseeId)) {
                    System.out.println("Request already exists");
                    return ResponseEntity.ok(existing);
                }
            }
            
            // Also check if they are already friends
            List<FriendshipDTO> existingFriends = testFriendshipsStore.get("friends");
            for (FriendshipDTO existing : existingFriends) {
                if ((existing.getAddressee().getId().equals(addresseeId) && existing.getRequester().getId().equals(requester.getId())) || 
                     (existing.getRequester().getId().equals(addresseeId) && existing.getAddressee().getId().equals(requester.getId()))) {
                    System.out.println("Already friends");
                    return ResponseEntity.ok(existing);
                }
            }
            
            // Save to the actual database first
            Friendship friendship = new Friendship();
            friendship.setRequester(requester);
            friendship.setAddressee(addressee);
            friendship.setStatus(Friendship.Status.PENDING);
            friendship = friendshipRepository.save(friendship);
            
            // Convert to DTO for response
            FriendshipDTO mockFriendship = convertToDTO(friendship);
            
            // Also store the request in in-memory collection for the current session
            testFriendshipsStore.get("outgoing").add(mockFriendship);
            
            // For demo purposes, also add a mirror entry to pending requests
            // to simulate the other user receiving the request
            testFriendshipsStore.get("pending").add(mockFriendship);
            
            System.out.println("Saved friendship to database with ID: " + friendship.getId());
            return ResponseEntity.ok(mockFriendship);
            
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error creating friendship: " + e.getMessage());
            
            // Extract requester ID from request body if provided
            Long fallbackRequesterId = null;
            if (requestBody != null && requestBody.containsKey("requesterId")) {
                fallbackRequesterId = Long.valueOf(requestBody.get("requesterId").toString());
            }
            
            // Create a mock friendship response as fallback
            FriendshipDTO mockFriendship = new FriendshipDTO();
            mockFriendship.setId(testFriendshipIdCounter++); 
            mockFriendship.setStatus("PENDING");
            
            // Mock requester (use provided ID or first user as fallback)
            UserDTO requesterDTO = new UserDTO();
            if (fallbackRequesterId != null) {
                userService.findById(fallbackRequesterId).ifPresent(user -> {
                    requesterDTO.setId(user.getId());
                    requesterDTO.setUsername(user.getUsername());
                    requesterDTO.setEmail(user.getEmail());
                    requesterDTO.setProfilePictureUrl(user.getProfilePictureUrl());
                    requesterDTO.setOnline(user.isOnline());
                });
            } else {
                userService.getAllUsers().stream().findFirst().ifPresent(user -> {
                    requesterDTO.setId(user.getId());
                    requesterDTO.setUsername(user.getUsername());
                    requesterDTO.setEmail(user.getEmail());
                    requesterDTO.setProfilePictureUrl(user.getProfilePictureUrl());
                    requesterDTO.setOnline(user.isOnline());
                });
            }
            
            // Mock addressee (user being requested)
            UserDTO addresseeDTO = new UserDTO();
            Long finalAddresseeId = addresseeId; // Create a final copy for use in lambda
            userService.findById(finalAddresseeId).ifPresent(user -> {
                addresseeDTO.setId(user.getId());
                addresseeDTO.setUsername(user.getUsername());
                addresseeDTO.setEmail(user.getEmail());
                addresseeDTO.setProfilePictureUrl(user.getProfilePictureUrl());
                addresseeDTO.setOnline(user.isOnline());
            });
            
            mockFriendship.setRequester(requesterDTO);
            mockFriendship.setAddressee(addresseeDTO);
            mockFriendship.setCreatedAt(LocalDateTime.now());
            mockFriendship.setUpdatedAt(LocalDateTime.now());
            
            // Store the request in outgoing collection for sender
            testFriendshipsStore.get("outgoing").add(mockFriendship);
            testFriendshipsStore.get("pending").add(mockFriendship);
            
            return ResponseEntity.ok(mockFriendship);
        }
    }
    
    /**
     * Test endpoint for accepting a friend request (no auth)
     * For development use only
     */
    @PostMapping("/{id}/accept-test")
    public ResponseEntity<FriendshipDTO> acceptFriendRequestTest(@PathVariable Long id) {
        try {
            // First try to find and update in the database
            Optional<Friendship> dbFriendshipOpt = friendshipRepository.findById(id);
            
            if (dbFriendshipOpt.isPresent()) {
                Friendship dbFriendship = dbFriendshipOpt.get();
                dbFriendship.setStatus(Friendship.Status.ACCEPTED);
                dbFriendship.setUpdatedAt(LocalDateTime.now());
                dbFriendship = friendshipRepository.save(dbFriendship);
                
                // Convert to DTO
                FriendshipDTO acceptedFriendship = convertToDTO(dbFriendship);
                
                // Also update the in-memory collections
                updateInMemoryCollections(acceptedFriendship);
                
                System.out.println("Updated friendship in database, ID: " + dbFriendship.getId() + ", Status: " + dbFriendship.getStatus());
                return ResponseEntity.ok(acceptedFriendship);
            }
            
            // If not in database, check in-memory collection
            List<FriendshipDTO> pendingRequests = testFriendshipsStore.get("pending");
            FriendshipDTO requestToAccept = null;
            
            for (FriendshipDTO request : pendingRequests) {
                if (request.getId().equals(id)) {
                    requestToAccept = request;
                    break;
                }
            }
            
            if (requestToAccept != null) {
                // Remove from pending
                pendingRequests.remove(requestToAccept);
                
                // Update status
                requestToAccept.setStatus("ACCEPTED");
                requestToAccept.setUpdatedAt(LocalDateTime.now());
                
                // Add to friends
                testFriendshipsStore.get("friends").add(requestToAccept);
                
                return ResponseEntity.ok(requestToAccept);
            }
            
            // If not found anywhere, return a 404
            return ResponseEntity.notFound().build();
            
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error accepting friendship: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Helper method to update in-memory collections with a friendship
    private void updateInMemoryCollections(FriendshipDTO friendship) {
        // Remove from all collections first
        for (List<FriendshipDTO> list : testFriendshipsStore.values()) {
            list.removeIf(f -> f.getId().equals(friendship.getId()));
        }
        
        // Add to the appropriate collection based on status
        if (friendship.getStatus().equals("ACCEPTED")) {
            testFriendshipsStore.get("friends").add(friendship);
        } else if (friendship.getStatus().equals("PENDING")) {
            testFriendshipsStore.get("pending").add(friendship);
            testFriendshipsStore.get("outgoing").add(friendship);
        }
    }
    
    /**
     * Test endpoint to check friendship status between two users (no auth)
     * For development use only
     * Consistent with the authenticated endpoint for easier frontend development
     */
    @GetMapping("/check-test")
    public ResponseEntity<Map<String, Object>> checkFriendshipStatusTest(
            @RequestParam Long user1Id, 
            @RequestParam Long user2Id) {
        
        // Prevent checking friendship with self
        if (user1Id.equals(user2Id)) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "SELF");
            response.put("message", "Cannot check friendship status with yourself");
            return ResponseEntity.ok(response);
        }
        
        try {
            // Check if the specified users exist
            Optional<User> user1Opt = userService.findById(user1Id);
            Optional<User> user2Opt = userService.findById(user2Id);
            
            if (!user1Opt.isPresent() || !user2Opt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            boolean areFriends = friendshipService.areFriends(user1Id, user2Id);
            boolean hasPendingRequest = friendshipService.friendshipExists(user1Id, user2Id) && !areFriends;
            
            // Get additional details about the friendship/request
            Optional<Friendship> friendshipOpt = friendshipService.findBetweenUsers(user1Id, user2Id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("areFriends", areFriends);
            response.put("hasPendingRequest", hasPendingRequest);
            
            if (friendshipOpt.isPresent()) {
                Friendship friendship = friendshipOpt.get();
                response.put("status", friendship.getStatus().name());
                response.put("friendshipId", friendship.getId());
                response.put("isRequester", friendship.getRequester().getId().equals(user1Id));
                response.put("isAddressee", friendship.getAddressee().getId().equals(user1Id));
                response.put("createdAt", friendship.getCreatedAt());
                response.put("updatedAt", friendship.getUpdatedAt());
            } else {
                response.put("status", "NONE");
            }
            
            System.out.println("Checking friendship between " + user1Id + " and " + user2Id + ": " + areFriends);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error checking friendship status: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to check friendship status");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Test endpoint for rejecting a friend request (no auth)
     * For development use only
     */
    @PostMapping("/{id}/reject-test")
    public ResponseEntity<FriendshipDTO> rejectFriendRequestTest(@PathVariable Long id) {
        // Find the request in the pending list
        List<FriendshipDTO> pendingRequests = testFriendshipsStore.get("pending");
        FriendshipDTO requestToReject = null;
        
        for (FriendshipDTO request : pendingRequests) {
            if (request.getId().equals(id)) {
                requestToReject = request;
                break;
            }
        }
        
        if (requestToReject != null) {
            // Remove from pending
            pendingRequests.remove(requestToReject);
            
            // Update status
            requestToReject.setStatus("REJECTED");
            
            return ResponseEntity.ok(requestToReject);
        }
        
        // If not found, return a 404
        return ResponseEntity.notFound().build();
    }
    
    // Helper method to create error responses
    private FriendshipDTO createErrorResponse(String errorMessage) {
        FriendshipDTO errorDTO = new FriendshipDTO();
        errorDTO.setId(-1L); // Indicator of error
        errorDTO.setStatus("ERROR");
        
        UserDTO errorUser = new UserDTO();
        errorUser.setUsername(errorMessage);
        errorDTO.setRequester(errorUser);
        
        return errorDTO;
    }
    
    // For testing purposes only - storage for test requests
    private static final Map<String, List<FriendshipDTO>> testFriendshipsStore = new HashMap<>();
    private static Long testFriendshipIdCounter = 1L;
    
    @Autowired
    private FriendshipRepository friendshipRepository;
    
    @PostConstruct
    public void initFriendshipStore() {
        // Initialize with empty lists
        testFriendshipsStore.put("outgoing", new ArrayList<>());
        testFriendshipsStore.put("pending", new ArrayList<>());
        testFriendshipsStore.put("friends", new ArrayList<>());
        
        // Load existing friendships from database into memory
        try {
            List<Friendship> dbFriendships = friendshipRepository.findAll();
            System.out.println("Loading " + dbFriendships.size() + " friendships from database into memory");
            
            for (Friendship friendship : dbFriendships) {
                FriendshipDTO dto = convertToDTO(friendship);
                
                if (friendship.getStatus() == Friendship.Status.PENDING) {
                    // For pending requests, add to both pending and outgoing collections
                    testFriendshipsStore.get("pending").add(dto);
                    testFriendshipsStore.get("outgoing").add(dto);
                } else if (friendship.getStatus() == Friendship.Status.ACCEPTED) {
                    testFriendshipsStore.get("friends").add(dto);
                }
                
                // Update ID counter
                if (friendship.getId() >= testFriendshipIdCounter) {
                    testFriendshipIdCounter = friendship.getId() + 1;
                }
            }
        } catch (Exception e) {
            System.err.println("Error loading friendships from database: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("Initialized test friendship store with data from database");
    }
    
    // Helper method to find a friendship by ID across all collections
    private FriendshipDTO findFriendshipById(Long id) {
        for (List<FriendshipDTO> friendships : testFriendshipsStore.values()) {
            for (FriendshipDTO friendship : friendships) {
                if (friendship.getId().equals(id)) {
                    return friendship;
                }
            }
        }
        return null;
    }
    
    // Helper method to check if two users already have any type of friendship
    private FriendshipDTO findFriendshipBetweenUsers(Long user1Id, Long user2Id) {
        for (List<FriendshipDTO> friendships : testFriendshipsStore.values()) {
            for (FriendshipDTO friendship : friendships) {
                if ((friendship.getRequester().getId().equals(user1Id) && 
                     friendship.getAddressee().getId().equals(user2Id)) ||
                    (friendship.getRequester().getId().equals(user2Id) && 
                     friendship.getAddressee().getId().equals(user1Id))) {
                    return friendship;
                }
            }
        }
        return null;
    }
}
