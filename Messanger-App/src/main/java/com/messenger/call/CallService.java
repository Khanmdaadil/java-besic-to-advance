package com.messenger.call;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing calls
 */
@Service
public class CallService {
    
    private final CallRepository callRepository;
    
    @Autowired
    public CallService(CallRepository callRepository) {
        this.callRepository = callRepository;
    }
    
    /**
     * Initiate a call
     * @param callerId ID of the caller
     * @param receiverId ID of the receiver
     * @param type Type of call (AUDIO/VIDEO)
     * @return Call object
     */
    public Call initiateCall(Long callerId, Long receiverId, Call.CallType type) {
        Call call = new Call();
        call.setCallerId(callerId);
        call.setReceiverId(receiverId);
        call.setType(type);
        call.setStatus(Call.CallStatus.RINGING);
        return callRepository.save(call);
    }
    
    /**
     * Answer a call
     * @param callId ID of the call
     * @return Updated call object
     */
    public Call answerCall(Long callId) {
        return updateCallStatus(callId, Call.CallStatus.ONGOING);
    }
    
    /**
     * End a call
     * @param callId ID of the call
     * @return Updated call object
     */
    public Call endCall(Long callId) {
        Call call = updateCallStatus(callId, Call.CallStatus.COMPLETED);
        call.setEndTime(LocalDateTime.now());
        return callRepository.save(call);
    }
    
    /**
     * Reject a call
     * @param callId ID of the call
     * @return Updated call object
     */
    public Call rejectCall(Long callId) {
        Call call = updateCallStatus(callId, Call.CallStatus.REJECTED);
        call.setEndTime(LocalDateTime.now());
        return callRepository.save(call);
    }
    
    /**
     * Mark a call as missed
     * @param callId ID of the call
     * @return Updated call object
     */
    public Call missCall(Long callId) {
        Call call = updateCallStatus(callId, Call.CallStatus.MISSED);
        call.setEndTime(LocalDateTime.now());
        return callRepository.save(call);
    }
    
    /**
     * Update call status
     * @param callId ID of the call
     * @param status New status
     * @return Updated call object
     */
    private Call updateCallStatus(Long callId, Call.CallStatus status) {
        Optional<Call> callOpt = callRepository.findById(callId);
        
        if (callOpt.isPresent()) {
            Call call = callOpt.get();
            call.setStatus(status);
            return callRepository.save(call);
        } else {
            throw new RuntimeException("Call not found with id: " + callId);
        }
    }
    
    /**
     * Get call by ID
     * @param callId ID of the call
     * @return Call object
     */
    public Optional<Call> getCallById(Long callId) {
        return callRepository.findById(callId);
    }
    
    /**
     * Get all calls between two users
     * @param user1Id ID of first user
     * @param user2Id ID of second user
     * @return List of calls
     */
    public List<Call> getCallsBetweenUsers(Long user1Id, Long user2Id) {
        return callRepository.findCallsBetweenUsers(user1Id, user2Id);
    }
    
    /**
     * Get all calls made by a user
     * @param callerId ID of the caller
     * @return List of calls
     */
    public List<Call> getCallsMadeByUser(Long callerId) {
        return callRepository.findByCallerIdOrderByStartTimeDesc(callerId);
    }
    
    /**
     * Get all calls received by a user
     * @param receiverId ID of the receiver
     * @return List of calls
     */
    public List<Call> getCallsReceivedByUser(Long receiverId) {
        return callRepository.findByReceiverIdOrderByStartTimeDesc(receiverId);
    }
    
    /**
     * Get ongoing calls for a user
     * @param userId ID of the user
     * @return List of ongoing calls
     */
    public List<Call> getOngoingCallsForUser(Long userId) {
        return callRepository.findOngoingCallsForUser(userId);
    }
}
