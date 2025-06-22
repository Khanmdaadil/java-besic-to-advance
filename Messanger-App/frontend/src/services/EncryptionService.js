import axios from 'axios';
import CryptoJS from 'crypto-js';

/**
 * Service for handling encryption and key exchange
 */
class EncryptionService {
  constructor() {
    this.axios = axios.create();
    this.sessions = new Map();
    
    // Add request interceptor to include token in all requests
    this.axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Initialize a new encryption session with a user
   * @param {string} userId - ID of the user to chat with
   * @returns {Promise<string>} - Session ID for the encryption session
   */
  async initEncryptionSession(userId) {
    try {
      // Check if we already have a session for this user
      if (this.sessions.has(userId)) {
        return this.sessions.get(userId).sessionId;
      }
      
      // Request a new session from the backend
      const response = await this.axios.post('/api/encryption/key-exchange/init');
      
      const { sessionId, publicKey } = response.data;
      
      // Store session data
      this.sessions.set(userId, {
        sessionId,
        publicKey,
        messageKeys: [],
        counter: 0
      });
      
      return sessionId;
    } catch (error) {
      console.error('Failed to initialize encryption session:', error);
      throw error;
    }
  }

  /**
   * Complete key exchange with another user
   * @param {string} userId - ID of the user to exchange keys with
   * @param {string} theirPublicKey - Public key received from the other user
   * @returns {Promise<object>} - Result of the key exchange
   */
  async completeKeyExchange(userId, theirPublicKey) {
    try {
      if (!this.sessions.has(userId)) {
        throw new Error('No session found for user');
      }
      
      const session = this.sessions.get(userId);
      
      // Send our public key and process their key
      const response = await this.axios.post('/api/encryption/key-exchange/complete', {
        sessionId: session.sessionId,
        publicKey: theirPublicKey
      });
      
      // Update our session with the new public key
      session.publicKey = response.data.publicKey;
      session.isEstablished = response.data.success === 'true';
      
      this.sessions.set(userId, session);
      
      return response.data;
    } catch (error) {
      console.error('Failed to complete key exchange:', error);
      throw error;
    }
  }

  /**
   * Encrypt a message for a specific user
   * @param {string} userId - ID of the recipient
   * @param {string} message - Plain text message to encrypt
   * @returns {object} - Encrypted message with session ID and metadata
   */
  async encryptMessage(userId, message) {
    try {
      // Make sure we have a session
      if (!this.sessions.has(userId)) {
        await this.initEncryptionSession(userId);
      }
      
      const session = this.sessions.get(userId);
      
      // Get or generate a message key
      let messageKey;
      if (session.messageKeys.length > 0) {
        // Use a precomputed message key
        messageKey = session.messageKeys.shift();
      } else {
        // Get a new message key from the server
        const response = await this.axios.post('/api/encryption/message-key', {
          sessionId: session.sessionId
        });
        messageKey = response.data.key;
      }
      
      // Encrypt the message with AES
      const encrypted = CryptoJS.AES.encrypt(message, messageKey).toString();
      
      // Increment message counter
      session.counter++;
      this.sessions.set(userId, session);
      
      return {
        encrypted,
        sessionId: session.sessionId,
        counter: session.counter,
        publicKey: session.publicKey
      };
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      throw error;
    }
  }

  /**
   * Decrypt a message from a specific user
   * @param {string} userId - ID of the sender
   * @param {object} encryptedMessage - Encrypted message with metadata
   * @returns {string} - Decrypted message
   */
  async decryptMessage(userId, encryptedMessage) {
    try {
      // Extract session information
      const { encrypted, sessionId, counter, publicKey } = encryptedMessage;
      
      // Update session information if needed
      if (!this.sessions.has(userId)) {
        this.sessions.set(userId, {
          sessionId,
          publicKey,
          counter: 0,
          messageKeys: []
        });
        
        // Complete key exchange with the other user's public key
        await this.completeKeyExchange(userId, publicKey);
      }
      
      // Get message key from the server
      const response = await this.axios.post('/api/encryption/message-key', {
        sessionId: sessionId
      });
      const messageKey = response.data.key;
      
      // Decrypt message
      const bytes = CryptoJS.AES.decrypt(encrypted, messageKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      throw error;
    }
  }
}

export default new EncryptionService();
