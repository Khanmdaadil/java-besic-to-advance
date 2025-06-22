import axios from 'axios';

const API_URL = '/api/calls/';

class CallService {
  constructor() {
    this.axios = axios.create();
    this.iceServers = null;
    
    // Add request interceptor to include token in all requests
    this.axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Get ICE servers configuration from backend
  async getIceServers() {
    if (this.iceServers) {
      return this.iceServers;
    }
    
    try {
      const response = await this.axios.get('/api/webrtc/ice-servers');
      this.iceServers = response.data;
      return this.iceServers;
    } catch (error) {
      console.error('Failed to fetch ICE servers:', error);
      // Fallback to public STUN servers if fetch fails
      return [
        {
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302'
          ]
        }
      ];
    }
  }

  async initiateCall(callerId, receiverId, callType) {
    const response = await this.axios.post(`${API_URL}initiate`, null, {
      params: {
        callerId,
        receiverId,
        callType
      }
    });
    
    return response.data;
  }

  async answerCall(callId) {
    const response = await this.axios.put(`${API_URL}${callId}/answer`);
    return response.data;
  }

  async endCall(callId) {
    const response = await this.axios.put(`${API_URL}${callId}/end`);
    return response.data;
  }

  async rejectCall(callId) {
    const response = await this.axios.put(`${API_URL}${callId}/reject`);
    return response.data;
  }

  async getCall(callId) {
    const response = await this.axios.get(`${API_URL}${callId}`);
    return response.data;
  }

  async getCallsBetweenUsers(user1Id, user2Id) {
    const response = await this.axios.get(`${API_URL}between/${user1Id}/${user2Id}`);
    return response.data;
  }

  async getCallsMadeByUser(userId) {
    const response = await this.axios.get(`${API_URL}made/${userId}`);
    return response.data;
  }

  async getCallsReceivedByUser(userId) {
    const response = await this.axios.get(`${API_URL}received/${userId}`);
    return response.data;
  }

  async getOngoingCalls(userId) {
    const response = await this.axios.get(`${API_URL}ongoing/${userId}`);
    return response.data;
  }
}

export default new CallService();
