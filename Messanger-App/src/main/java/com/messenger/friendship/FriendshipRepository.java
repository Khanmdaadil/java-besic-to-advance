package com.messenger.friendship;

import com.messenger.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    
    // Find all friendships where user is requester or addressee
    @Query("SELECT f FROM Friendship f WHERE " +
            "(f.requester = :user OR f.addressee = :user) " +
            "AND f.status = 'ACCEPTED'")
    List<Friendship> findAllFriendshipsForUser(@Param("user") User user);
    
    // Find pending friend requests sent to a user
    List<Friendship> findByAddresseeAndStatus(User addressee, Friendship.Status status);
    
    // Find pending friend requests sent by a user
    List<Friendship> findByRequesterAndStatus(User requester, Friendship.Status status);
    
    // Find a specific friendship between two users
    @Query("SELECT f FROM Friendship f WHERE " +
            "((f.requester = :user1 AND f.addressee = :user2) " +
            "OR (f.requester = :user2 AND f.addressee = :user1))")
    Optional<Friendship> findBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
}
