import axios from 'axios';

const API_URL = '/api/auth/';

class AuthService {
  async login(username, password) {
    const response = await axios.post(API_URL + 'login', {
      username,
      password
    });
    return response.data;
  }

  async register(username, email, password, publicKey) {
    const response = await axios.post(API_URL + 'register', {
      username,
      email,
      password,
      publicKey
    });
    return response.data;
  }

  async logout(username) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    await axios.post(API_URL + 'logout', 
      { username },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
  }

  async validateToken(token) {
    try {
      const response = await axios.get(API_URL + 'validate', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new Error('Token validation failed');
    }
  }
}

export default new AuthService();
