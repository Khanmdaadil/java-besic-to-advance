package com.messenger.file;

import com.messenger.encryption.EncryptionService;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

/**
 * Service for handling file operations
 */
@Service
public class FileService {
    
    private final Path fileStorageLocation;
    private final FileRepository fileRepository;
    private final EncryptionService encryptionService;
    
    @Autowired
    public FileService(FileRepository fileRepository,
                      @Value("${file.upload.directory}") String uploadDir) {
        this.fileRepository = fileRepository;
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.encryptionService = new EncryptionService();
        
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create the directory for file storage", ex);
        }
    }
    
    /**
     * Store a file with optional encryption
     * @param file File to store
     * @param senderId Sender ID
     * @param recipientId Recipient ID
     * @param encryptFile Whether to encrypt the file
     * @param encryptionKey Encryption key
     * @return Stored file entity
     */
    public SharedFile storeFile(MultipartFile file, Long senderId, Long recipientId, 
                              boolean encryptFile, String encryptionKey) {
        try {
            // Ensure filename is safe for storage
            String filename = StringUtils.cleanPath(file.getOriginalFilename());
            
            // Check if the file has a valid extension
            String extension = FilenameUtils.getExtension(filename);
            if(!isSupportedExtension(extension)) {
                throw new RuntimeException("File type not allowed: " + extension);
            }
            
            // Check if the file size is within limits (10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new RuntimeException("File exceeds maximum size of 10MB");
            }
            
            // Generate a unique filename to prevent overwriting
            String uniqueFilename = UUID.randomUUID().toString() + "." + extension;
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFilename);
            
            // If encryption is requested, encrypt the file before saving
            if (encryptFile && encryptionKey != null) {
                try (InputStream inputStream = file.getInputStream()) {
                    // Read the file content
                    byte[] content = inputStream.readAllBytes();
                    
                    // Convert to string for encryption (in production, use a more robust approach for binary files)
                    String contentStr = new String(content);
                    String encrypted = encryptionService.encrypt(contentStr, encryptionKey);
                    
                    // Write the encrypted content
                    Files.write(targetLocation, encrypted.getBytes());
                }
            } else {
                // For unencrypted files, simply copy
                try (InputStream inputStream = file.getInputStream()) {
                    Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
                }
            }
            
            // Create and save the file entity
            SharedFile sharedFile = new SharedFile();
            sharedFile.setSenderId(senderId);
            sharedFile.setRecipientId(recipientId);
            sharedFile.setFilename(filename);
            sharedFile.setPath(uniqueFilename);
            sharedFile.setContentType(file.getContentType());
            sharedFile.setSize(file.getSize());
            sharedFile.setEncrypted(encryptFile);
            
            return fileRepository.save(sharedFile);
        } catch (IOException ex) {
            throw new RuntimeException("Could not store the file", ex);
        } catch (Exception ex) {
            throw new RuntimeException("An error occurred during file processing", ex);
        }
    }
    
    /**
     * Load a file as a Resource
     * @param fileId File ID
     * @param decryptionKey Key for decryption (if file is encrypted)
     * @return Resource for the file
     */
    public Resource loadFileAsResource(Long fileId, String decryptionKey) {
        try {
            SharedFile sharedFile = fileRepository.findById(fileId)
                    .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));
            
            Path filePath = this.fileStorageLocation.resolve(sharedFile.getPath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if(resource.exists()) {
                // If file is encrypted and decryption key is provided, decrypt it
                if (sharedFile.isEncrypted() && decryptionKey != null) {
                    try {
                        String encryptedContent = new String(Files.readAllBytes(filePath));
                        String decryptedContent = encryptionService.decrypt(encryptedContent, decryptionKey);
                        
                        // Create a temporary file for the decrypted content
                        Path tempFile = Files.createTempFile("decrypted_", "_" + sharedFile.getFilename());
                        Files.write(tempFile, decryptedContent.getBytes());
                        
                        return new UrlResource(tempFile.toUri());
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to decrypt file", e);
                    }
                }
                return resource;
            } else {
                throw new RuntimeException("File not found: " + sharedFile.getPath());
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found", ex);
        }
    }
    
    /**
     * Get files shared between two users
     * @param senderId Sender ID
     * @param recipientId Recipient ID
     * @return List of shared files
     */
    public List<SharedFile> getFilesBetweenUsers(Long senderId, Long recipientId) {
        return fileRepository.findBySenderIdAndRecipientIdOrderByUploadTimeDesc(senderId, recipientId);
    }
    
    /**
     * Get files sent by a user
     * @param senderId Sender ID
     * @return List of shared files
     */
    public List<SharedFile> getFilesSentByUser(Long senderId) {
        return fileRepository.findBySenderIdOrderByUploadTimeDesc(senderId);
    }
    
    /**
     * Get files received by a user
     * @param recipientId Recipient ID
     * @return List of shared files
     */
    public List<SharedFile> getFilesReceivedByUser(Long recipientId) {
        return fileRepository.findByRecipientIdOrderByUploadTimeDesc(recipientId);
    }
    
    /**
     * Check if a file extension is supported
     * @param extension File extension
     * @return True if supported
     */
    private boolean isSupportedExtension(String extension) {
        // List of allowed file extensions
        List<String> allowedExtensions = List.of(
            "jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"
        );
        
        return extension != null && allowedExtensions.contains(extension.toLowerCase());
    }
}
