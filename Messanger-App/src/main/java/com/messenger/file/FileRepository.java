package com.messenger.file;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for SharedFile entity operations
 */
@Repository
public interface FileRepository extends JpaRepository<SharedFile, Long> {
    
    /**
     * Find all files shared between two users
     * @param senderId Sender ID
     * @param recipientId Recipient ID
     * @return List of shared files
     */
    List<SharedFile> findBySenderIdAndRecipientIdOrderByUploadTimeDesc(Long senderId, Long recipientId);
    
    /**
     * Find all files sent by a user
     * @param senderId Sender ID
     * @return List of shared files
     */
    List<SharedFile> findBySenderIdOrderByUploadTimeDesc(Long senderId);
    
    /**
     * Find all files received by a user
     * @param recipientId Recipient ID
     * @return List of shared files
     */
    List<SharedFile> findByRecipientIdOrderByUploadTimeDesc(Long recipientId);
}
