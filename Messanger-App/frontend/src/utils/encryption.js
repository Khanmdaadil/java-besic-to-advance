import CryptoJS from 'crypto-js';

// Initialize encryption system
export const initializeEncryption = () => {
  // This is a placeholder for any global encryption setup
  console.log('Encryption system initialized');
};

// Generate a random AES key
export const generateAESKey = () => {
  const keyBytes = new Uint8Array(32); // 256 bits
  window.crypto.getRandomValues(keyBytes);
  return Array.from(keyBytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Encrypt message with AES
export const encryptMessage = (message, key) => {
  try {
    return CryptoJS.AES.encrypt(message, key).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

// Decrypt message with AES
export const decryptMessage = (encryptedMessage, key) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Generate RSA key pair (simulated with placeholder function, as browser crypto API doesn't support RSA key gen directly)
export const generateKeyPair = () => {
  // In production, use Web Crypto API or a dedicated library for actual RSA key generation
  // This is a placeholder that returns dummy strings for the tutorial
  return {
    publicKey: 'simulated-public-key-' + Date.now(),
    privateKey: 'simulated-private-key-' + Date.now()
  };
};

// Hash a password (for demonstration purposes)
export const hashPassword = (password) => {
  return CryptoJS.SHA256(password).toString();
};

// Verify file integrity with hash
export const hashFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
      const hash = CryptoJS.SHA256(wordArray).toString();
      resolve(hash);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
