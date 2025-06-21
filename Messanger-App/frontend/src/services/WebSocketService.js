import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// WebSocket service for real-time communication
class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.messageHandlers = new Map();
    this.callHandlers = new Map();
    this.webRTCHandlers = new Map();
    this.receiptHandlers = new Map();
    this.friendshipHandlers = new Map();
  }

  // Connect to WebSocket
  connect(onConnect = null, onError = null) {
    if (this.stompClient) {
      return;
    }

    // Dynamically determine the WebSocket endpoint based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const isHttps = window.location.protocol === 'https:';
    
    // For HTTPS connections, always use a relative URL to ensure security
    // This avoids the "insecure SockJS connection" error
    let wsUrl = '/ws';
    
    // Only use explicit URL with protocol for non-HTTPS connections in development
    if (!isHttps && !isProduction) {
      // Use the API URL from environment in development
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      wsUrl = `${apiUrl}/ws`;
    }
    
    console.log('Connecting to WebSocket at:', wsUrl, 'HTTPS:', isHttps);
    
    // Setting SockJS connection options
    const options = {
      transports: ['websocket', 'xhr-streaming', 'xhr-polling', 'eventsource']
    };
    
    const socket = new SockJS(wsUrl, null, options);
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {}
    });

    // Set up connect callback
    this.stompClient.onConnect = frame => {
      this.connected = true;
      console.log('WebSocket connected');
      if (onConnect) onConnect(frame);
    };

    // Set up error callback
    this.stompClient.onStompError = error => {
      console.error('WebSocket connection error:', error);
      this.connected = false;
      if (onError) onError(error);
    };
    
    // Activate the connection
    this.stompClient.activate();
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.stompClient) {
      try {
        this.stompClient.deactivate();
        console.log('WebSocket deactivated');
      } catch (error) {
        console.error('Error disconnecting WebSocket:', error);
      } finally {
        this.stompClient = null;
        this.connected = false;
        console.log('WebSocket disconnected');
      }
    }
  }

  // Subscribe to user's private message queue
  subscribeToUserMessages(userId, callback) {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    const destination = `/user/${userId}/queue/messages`;
    const subscription = this.stompClient.subscribe(destination, (message) => {
      const messageData = JSON.parse(message.body);
      callback(messageData);
    });

    this.messageHandlers.set(userId, subscription);
    return subscription;
  }

  // Subscribe to read receipts
  subscribeToReadReceipts(userId, callback) {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    const destination = `/user/${userId}/queue/receipts`;
    const subscription = this.stompClient.subscribe(destination, (message) => {
      const receiptData = JSON.parse(message.body);
      callback(receiptData);
    });

    this.receiptHandlers.set(userId, subscription);
    return subscription;
  }

  // Subscribe to call notifications
  subscribeToCallNotifications(userId, callback) {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    const destination = `/user/${userId}/queue/calls`;
    const subscription = this.stompClient.subscribe(destination, (message) => {
      const callData = JSON.parse(message.body);
      callback(callData);
    });

    this.callHandlers.set(userId, subscription);
    return subscription;
  }

  // Subscribe to WebRTC signaling
  subscribeToWebRTC(userId, callback) {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    const destination = `/user/${userId}/queue/webrtc`;
    const subscription = this.stompClient.subscribe(destination, (message) => {
      const signalData = JSON.parse(message.body);
      callback(signalData);
    });

    this.webRTCHandlers.set(userId, subscription);
    return subscription;
  }

  // Subscribe to friendship notifications
  subscribeToFriendshipNotifications(userId, callback) {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    const destination = `/user/${userId}/queue/notifications`;
    const subscription = this.stompClient.subscribe(destination, (message) => {
      const notificationData = JSON.parse(message.body);
      callback(notificationData);
    });

    this.friendshipHandlers.set(userId, subscription);
    return subscription;
  }

  // Send a chat message
  sendMessage(message) {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      this.stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(message)
      });
      console.log('Message sent successfully:', message);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // Send read receipt for a message
  sendReadReceipt(receipt) {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      this.stompClient.publish({
        destination: '/app/chat.read',
        body: JSON.stringify(receipt)
      });
      console.log('Read receipt sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending read receipt:', error);
      return false;
    }
  }

  // Send WebRTC offer signal
  sendOffer(signal) {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      this.stompClient.publish({
        destination: '/app/call.offer',
        body: JSON.stringify(signal)
      });
      console.log('WebRTC offer sent');
      return true;
    } catch (error) {
      console.error('Error sending WebRTC offer:', error);
      return false;
    }
  }

  // Send WebRTC answer signal
  sendAnswer(signal) {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      this.stompClient.publish({
        destination: '/app/call.answer',
        body: JSON.stringify(signal)
      });
      console.log('WebRTC answer sent');
      return true;
    } catch (error) {
      console.error('Error sending WebRTC answer:', error);
      return false;
    }
  }

  // Send ICE candidate
  sendIceCandidate(signal) {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      this.stompClient.publish({
        destination: '/app/call.ice',
        body: JSON.stringify(signal)
      });
      return true;
    } catch (error) {
      console.error('Error sending ICE candidate:', error);
      return false;
    }
  }

  // Send hangup signal
  sendHangup(signal) {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      this.stompClient.publish({
        destination: '/app/call.hangup',
        body: JSON.stringify(signal)
      });
      console.log('Hangup signal sent');
      return true;
    } catch (error) {
      console.error('Error sending hangup signal:', error);
      return false;
    }
  }

  // Unsubscribe from all
  unsubscribeAll() {
    this.messageHandlers.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.messageHandlers.clear();

    this.receiptHandlers.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.receiptHandlers.clear();
    
    this.friendshipHandlers.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.friendshipHandlers.clear();
    this.receiptHandlers.clear();

    this.callHandlers.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.callHandlers.clear();

    this.webRTCHandlers.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.webRTCHandlers.clear();

    this.friendshipHandlers.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.friendshipHandlers.clear();
  }
}

export default new WebSocketService();
