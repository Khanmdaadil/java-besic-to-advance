package com.messenger.friendship;

import com.messenger.user.User;
import com.messenger.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class FriendshipService {
    
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    
    @Autowired
    public FriendshipService(FriendshipRepository friendshipRepository, UserRepository userRepository) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Get all friends for a user
     * @param userId The user ID
     * @return List of friendships
     */
    public List<Friendship> getUserFriendships(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
        return friendshipRepository.findAllFriendshipsForUser(user);
    }
    
    /**
     * Get pending friend requests sent to the user
     * @param userId The user ID
     * @return List of pending friend requests
     */
    public List<Friendship> getPendingFriendRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
        return friendshipRepository.findByAddresseeAndStatus(user, Friendship.Status.PENDING);
    }
    
    /**
     * Get outgoing friend requests sent by the user
     * @param userId The user ID
     * @return List of outgoing friend requests
     */
    public List<Friendship> getOutgoingFriendRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
        return friendshipRepository.findByRequesterAndStatus(user, Friendship.Status.PENDING);
    }
    
    /**
     * Send a friend request
     * @param requesterId The requester user ID
     * @param addresseeId The addressee user ID
     * @return The created friendship
     */
    @Transactional
    public Friendship sendFriendRequest(Long requesterId, Long addresseeId) {
        if (requesterId.equals(addresseeId)) {
            throw new IllegalArgumentException("Cannot send friend request to self");
        }
        
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("Requester not found with ID: " + requesterId));
        User addressee = userRepository.findById(addresseeId)
                .orElseThrow(() -> new IllegalArgumentException("Addressee not found with ID: " + addresseeId));
        
        // Check if a friendship already exists
        Optional<Friendship> existingFriendship = friendshipRepository.findBetweenUsers(requester, addressee);
        
        if (existingFriendship.isPresent()) {
            Friendship friendship = existingFriendship.get();
            
            // If already friends or request is pending, return the existing friendship
            if (friendship.getStatus() == Friendship.Status.ACCEPTED || 
                    friendship.getStatus() == Friendship.Status.PENDING) {
                return friendship;
            }
            
            // If previously rejected, allow resending by updating the existing record
            if (friendship.getStatus() == Friendship.Status.REJECTED) {
                friendship.setStatus(Friendship.Status.PENDING);
                friendship.setRequester(requester);
                friendship.setAddressee(addressee);
                return friendshipRepository.save(friendship);
            }
        }
        
        // Create a new friendship request
        Friendship friendship = new Friendship();
        friendship.setRequester(requester);
        friendship.setAddressee(addressee);
        friendship.setStatus(Friendship.Status.PENDING);
        
        return friendshipRepository.save(friendship);
    }
    
    /**
     * Accept a friend request
     * @param friendshipId The friendship ID
     * @param userId The user ID of the person accepting
     * @return The updated friendship
     */
    @Transactional
    public Friendship acceptFriendRequest(Long friendshipId, Long userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Friendship not found with ID: " + friendshipId));
        
        // Verify that the user accepting is the addressee
        if (!friendship.getAddressee().getId().equals(userId)) {
            throw new IllegalArgumentException("Only the request recipient can accept this request");
        }
        
        // Verify the request is pending
        if (friendship.getStatus() != Friendship.Status.PENDING) {
            throw new IllegalArgumentException("Can only accept pending friend requests");
        }
        
        friendship.setStatus(Friendship.Status.ACCEPTED);
        return friendshipRepository.save(friendship);
    }
    
    /**
     * Reject a friend request
     * @param friendshipId The friendship ID
     * @param userId The user ID of the person rejecting
     * @return The updated friendship
     */
    @Transactional
    public Friendship rejectFriendRequest(Long friendshipId, Long userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Friendship not found with ID: " + friendshipId));
        
        // Verify that the user rejecting is the addressee
        if (!friendship.getAddressee().getId().equals(userId)) {
            throw new IllegalArgumentException("Only the request recipient can reject this request");
        }
        
        // Verify the request is pending
        if (friendship.getStatus() != Friendship.Status.PENDING) {
            throw new IllegalArgumentException("Can only reject pending friend requests");
        }
        
        friendship.setStatus(Friendship.Status.REJECTED);
        return friendshipRepository.save(friendship);
    }
    
    /**
     * Check if two users are friends
     * @param user1Id First user ID
     * @param user2Id Second user ID
     * @return true if users are friends, false otherwise
     */
    public boolean areFriends(Long user1Id, Long user2Id) {
        User user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + user1Id));
        User user2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + user2Id));
        
        Optional<Friendship> friendship = friendshipRepository.findBetweenUsers(user1, user2);
        return friendship.isPresent() && friendship.get().getStatus() == Friendship.Status.ACCEPTED;
    }
    
    /**
     * Check if any friendship or request exists between two users
     * @param user1Id First user ID
     * @param user2Id Second user ID
     * @return true if friendship exists in any state, false otherwise
     */
    public boolean friendshipExists(Long user1Id, Long user2Id) {
        User user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + user1Id));
        User user2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + user2Id));
        
        Optional<Friendship> friendship = friendshipRepository.findBetweenUsers(user1, user2);
        return friendship.isPresent();
    }
    
    /**
     * Get friendship by ID
     * @param id Friendship ID
     * @return Optional containing the friendship if found
     */
    public Optional<Friendship> getFriendshipById(Long id) {
        return friendshipRepository.findById(id);
    }
    
    /**
     * Find friendship between two users regardless of who is requester or addressee
     * @param user1Id First user ID
     * @param user2Id Second user ID
     * @return Optional containing the friendship if found
     */
    public Optional<Friendship> findBetweenUsers(Long user1Id, Long user2Id) {
        User user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + user1Id));
        User user2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + user2Id));
        
        return friendshipRepository.findBetweenUsers(user1, user2);
    }
}
