import axios from 'axios';

const API_URL = '/api/files/';

class FileService {
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

  async uploadFile(file, senderId, recipientId, encrypt = false, encryptionKey = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('senderId', senderId);
    formData.append('recipientId', recipientId);
    formData.append('encrypt', encrypt);
    
    if (encrypt && encryptionKey) {
      formData.append('encryptionKey', encryptionKey);
    }
    
    const response = await this.axios.post(`${API_URL}upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  }

  getFileDownloadUrl(fileId, decryptionKey = null) {
    let url = `${API_URL}download/${fileId}`;
    if (decryptionKey) {
      url += `?decryptionKey=${encodeURIComponent(decryptionKey)}`;
    }
    return url;
  }

  async getFilesBetweenUsers(senderId, recipientId) {
    const response = await this.axios.get(`${API_URL}between/${senderId}/${recipientId}`);
    return response.data;
  }

  async getFilesSentByUser(userId) {
    const response = await this.axios.get(`${API_URL}sent/${userId}`);
    return response.data;
  }

  async getFilesReceivedByUser(userId) {
    const response = await this.axios.get(`${API_URL}received/${userId}`);
    return response.data;
  }
}

export default new FileService();
