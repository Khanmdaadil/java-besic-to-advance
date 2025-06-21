package com.messenger.friendship;

import com.messenger.user.UserDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for Friendship
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FriendshipDTO {
    private Long id;
    private UserDTO requester;
    private UserDTO addressee;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
