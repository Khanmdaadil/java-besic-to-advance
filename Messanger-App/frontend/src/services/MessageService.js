import axios from 'axios';

const API_URL = '/api/messages';
const FRIENDSHIP_API_URL = '/api/friendships';

class MessageService {
  constructor() {
    this.axios = axios.create();
    
    // Add request interceptor to include token in all requests
    this.axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });
  }
  
  // Check if users are friends
  async checkFriendshipStatus(userId) {
    try {
      // Try the authenticated endpoint
      try {
        const response = await this.axios.get(`${FRIENDSHIP_API_URL}/check/${userId}`);
        return response.data;
      } catch (authError) {
        // Fallback to test endpoint during development/testing
        console.warn('Using test friendship endpoint', authError);
        const response = await axios.get(`${FRIENDSHIP_API_URL}/check-test`, {
          params: { user1Id: parseInt(localStorage.getItem('userId')), user2Id: userId }
        });
        return response.data;
      }
    } catch (error) {
      console.error('Error checking friendship:', error);
      return { areFriends: false, status: 'UNKNOWN' };
    }
  }

  // Get messages between current user and another user
  async getConversation(otherUserId) {
    try {
      // Try the authenticated endpoint
      try {
        const response = await this.axios.get(`${API_URL}/conversation/${otherUserId}`);
        return response.data;
      } catch (authError) {
        // Fallback to test endpoint during development/testing
        console.warn('Using test messages endpoint', authError);
        const response = await axios.get(`${API_URL}/between/${localStorage.getItem('userId')}/${otherUserId}`);
        return response.data;
      }
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  // Get unread messages for current user
  async getUnreadMessages() {
    try {
      // Try the authenticated endpoint
      try {
        const response = await this.axios.get(`${API_URL}/unread`);
        return response.data;
      } catch (authError) {
        // Fallback to test endpoint during development/testing
        console.warn('Using test unread messages endpoint', authError);
        const response = await axios.get(`${API_URL}/unread/${localStorage.getItem('userId')}`);
        return response.data;
      }
    } catch (error) {
      console.error('Error getting unread messages:', error);
      throw error;
    }
  }

  // Send a new message
  async sendMessage(recipientId, content) {
    try {
      const response = await this.axios.post(`${API_URL}/send`, {
        recipientId,
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark message as read
  async markAsRead(messageId) {
    try {
      const response = await this.axios.put(`${API_URL}/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Set self-destruct timer for a message
  async setSelfDestructTimer(messageId, minutes) {
    try {
      const response = await this.axios.put(`${API_URL}/${messageId}/self-destruct?minutes=${minutes}`);
      return response.data;
    } catch (error) {
      console.error('Error setting self-destruct timer:', error);
      throw error;
    }
  }
}

export default new MessageService();
