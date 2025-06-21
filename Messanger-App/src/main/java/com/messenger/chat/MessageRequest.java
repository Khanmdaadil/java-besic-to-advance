package com.messenger.chat;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * Data transfer object for message requests
 */
public class MessageRequest {
    
    @NotNull(message = "Recipient ID is required")
    private Long recipientId;
    
    @NotBlank(message = "Content cannot be blank")
    private String content;
    
    public Long getRecipientId() {
        return recipientId;
    }
    
    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
}
