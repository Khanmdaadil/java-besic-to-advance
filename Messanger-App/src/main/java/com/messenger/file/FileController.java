package com.messenger.file;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controller for file operations
 */
@RestController
@RequestMapping("/api/files")
public class FileController {
    
    private final FileService fileService;
    
    @Autowired
    public FileController(FileService fileService) {
        this.fileService = fileService;
    }
    
    /**
     * Upload a file
     * @param file File to upload
     * @param senderId Sender ID
     * @param recipientId Recipient ID
     * @param encrypt Whether to encrypt the file
     * @param encryptionKey Encryption key (if encrypt is true)
     * @return The uploaded file entity
     */
    @PostMapping("/upload")
    public ResponseEntity<SharedFile> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("senderId") Long senderId,
            @RequestParam("recipientId") Long recipientId,
            @RequestParam(value = "encrypt", defaultValue = "false") boolean encrypt,
            @RequestParam(value = "encryptionKey", required = false) String encryptionKey) {
        
        SharedFile sharedFile = fileService.storeFile(file, senderId, recipientId, encrypt, encryptionKey);
        return ResponseEntity.ok(sharedFile);
    }
    
    /**
     * Download a file
     * @param fileId File ID
     * @param decryptionKey Decryption key (if file is encrypted)
     * @return The file resource
     */
    @GetMapping("/download/{fileId}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long fileId,
            @RequestParam(value = "decryptionKey", required = false) String decryptionKey) {
        
        Resource resource = fileService.loadFileAsResource(fileId, decryptionKey);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
    
    /**
     * Get files shared between two users
     * @param senderId Sender ID
     * @param recipientId Recipient ID
     * @return List of shared files
     */
    @GetMapping("/between/{senderId}/{recipientId}")
    public ResponseEntity<List<SharedFile>> getFilesBetweenUsers(
            @PathVariable Long senderId,
            @PathVariable Long recipientId) {
        
        List<SharedFile> files = fileService.getFilesBetweenUsers(senderId, recipientId);
        return ResponseEntity.ok(files);
    }
    
    /**
     * Get files sent by a user
     * @param userId User ID
     * @return List of sent files
     */
    @GetMapping("/sent/{userId}")
    public ResponseEntity<List<SharedFile>> getFilesSentByUser(@PathVariable Long userId) {
        List<SharedFile> files = fileService.getFilesSentByUser(userId);
        return ResponseEntity.ok(files);
    }
    
    /**
     * Get files received by a user
     * @param userId User ID
     * @return List of received files
     */
    @GetMapping("/received/{userId}")
    public ResponseEntity<List<SharedFile>> getFilesReceivedByUser(@PathVariable Long userId) {
        List<SharedFile> files = fileService.getFilesReceivedByUser(userId);
        return ResponseEntity.ok(files);
    }
}
