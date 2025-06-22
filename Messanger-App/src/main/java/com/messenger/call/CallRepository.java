package com.messenger.call;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Call entity operations
 */
@Repository
public interface CallRepository extends JpaRepository<Call, Long> {
    
    /**
     * Find all calls between two users
     * @param user1Id First user ID
     * @param user2Id Second user ID
     * @return List of calls
     */
    @Query("SELECT c FROM Call c WHERE " +
            "(c.callerId = ?1 AND c.receiverId = ?2) OR " +
            "(c.callerId = ?2 AND c.receiverId = ?1) " +
            "ORDER BY c.startTime DESC")
    List<Call> findCallsBetweenUsers(Long user1Id, Long user2Id);
    
    /**
     * Find all calls made by a user
     * @param callerId Caller ID
     * @return List of calls
     */
    List<Call> findByCallerIdOrderByStartTimeDesc(Long callerId);
    
    /**
     * Find all calls received by a user
     * @param receiverId Receiver ID
     * @return List of calls
     */
    List<Call> findByReceiverIdOrderByStartTimeDesc(Long receiverId);
    
    /**
     * Find ongoing calls for a user
     * @param userId User ID
     * @return List of ongoing calls
     */
    @Query("SELECT c FROM Call c WHERE " +
            "(c.callerId = ?1 OR c.receiverId = ?1) AND " +
            "c.status = 'ONGOING' " +
            "ORDER BY c.startTime DESC")
    List<Call> findOngoingCallsForUser(Long userId);
}
