package com.messenger.call;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for call operations
 */
@RestController
@RequestMapping("/api/calls")
public class CallController {
    
    private final CallService callService;
    private final SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    public CallController(CallService callService, SimpMessagingTemplate messagingTemplate) {
        this.callService = callService;
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * Initiate a call
     * @param callerId ID of the caller
     * @param receiverId ID of the receiver
     * @param callType Type of call (AUDIO/VIDEO)
     * @return Call object
     */
    @PostMapping("/initiate")
    public ResponseEntity<Call> initiateCall(
            @RequestParam Long callerId,
            @RequestParam Long receiverId,
            @RequestParam Call.CallType callType) {
        
        Call call = callService.initiateCall(callerId, receiverId, callType);
        
        // Notify the receiver about the incoming call
        messagingTemplate.convertAndSendToUser(
                String.valueOf(receiverId),
                "/queue/calls",
                call
        );
        
        return ResponseEntity.ok(call);
    }
    
    /**
     * Answer a call
     * @param callId ID of the call
     * @return Updated call object
     */
    @PutMapping("/{callId}/answer")
    public ResponseEntity<Call> answerCall(@PathVariable Long callId) {
        Call call = callService.answerCall(callId);
        
        // Notify the caller that the call was answered
        messagingTemplate.convertAndSendToUser(
                String.valueOf(call.getCallerId()),
                "/queue/calls",
                call
        );
        
        return ResponseEntity.ok(call);
    }
    
    /**
     * End a call
     * @param callId ID of the call
     * @return Updated call object
     */
    @PutMapping("/{callId}/end")
    public ResponseEntity<Call> endCall(@PathVariable Long callId) {
        Call call = callService.endCall(callId);
        
        // Notify the other party that the call was ended
        Long notifyUserId = call.getCallerId();
        if (notifyUserId.equals(call.getCallerId())) {
            notifyUserId = call.getReceiverId();
        }
        
        messagingTemplate.convertAndSendToUser(
                String.valueOf(notifyUserId),
                "/queue/calls",
                call
        );
        
        return ResponseEntity.ok(call);
    }
    
    /**
     * Reject a call
     * @param callId ID of the call
     * @return Updated call object
     */
    @PutMapping("/{callId}/reject")
    public ResponseEntity<Call> rejectCall(@PathVariable Long callId) {
        Call call = callService.rejectCall(callId);
        
        // Notify the caller that the call was rejected
        messagingTemplate.convertAndSendToUser(
                String.valueOf(call.getCallerId()),
                "/queue/calls",
                call
        );
        
        return ResponseEntity.ok(call);
    }
    
    /**
     * Get call by ID
     * @param callId ID of the call
     * @return Call object
     */
    @GetMapping("/{callId}")
    public ResponseEntity<?> getCall(@PathVariable Long callId) {
        return callService.getCallById(callId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get all calls between two users
     * @param user1Id ID of first user
     * @param user2Id ID of second user
     * @return List of calls
     */
    @GetMapping("/between/{user1Id}/{user2Id}")
    public ResponseEntity<List<Call>> getCallsBetweenUsers(
            @PathVariable Long user1Id,
            @PathVariable Long user2Id) {
        
        List<Call> calls = callService.getCallsBetweenUsers(user1Id, user2Id);
        return ResponseEntity.ok(calls);
    }
    
    /**
     * Get all calls made by a user
     * @param userId ID of the user
     * @return List of calls
     */
    @GetMapping("/made/{userId}")
    public ResponseEntity<List<Call>> getCallsMadeByUser(@PathVariable Long userId) {
        List<Call> calls = callService.getCallsMadeByUser(userId);
        return ResponseEntity.ok(calls);
    }
    
    /**
     * Get all calls received by a user
     * @param userId ID of the user
     * @return List of calls
     */
    @GetMapping("/received/{userId}")
    public ResponseEntity<List<Call>> getCallsReceivedByUser(@PathVariable Long userId) {
        List<Call> calls = callService.getCallsReceivedByUser(userId);
        return ResponseEntity.ok(calls);
    }
    
    /**
     * Get ongoing calls for a user
     * @param userId ID of the user
     * @return List of ongoing calls
     */
    @GetMapping("/ongoing/{userId}")
    public ResponseEntity<List<Call>> getOngoingCalls(@PathVariable Long userId) {
        List<Call> calls = callService.getOngoingCallsForUser(userId);
        return ResponseEntity.ok(calls);
    }
}
