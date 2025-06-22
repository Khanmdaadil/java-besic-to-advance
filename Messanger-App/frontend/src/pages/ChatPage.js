import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Container, Paper, Drawer, useMediaQuery, useTheme,
  Snackbar, Alert, CircularProgress, Typography, Button
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ContactList from '../components/ContactList';
import ChatWindow from '../components/ChatWindow';
import CallDialog from '../components/CallDialog';
import WebSocketService from '../services/WebSocketService';
import MessageService from '../services/MessageService';
import FileService from '../services/FileService';
import CallService from '../services/CallService';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ChatPage = ({ darkMode, toggleDarkMode }) => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  
  const { currentUser, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const drawerWidth = 320;
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login', { state: { from: '/chat' } });
    }
  }, [isAuthenticated, navigate, loading]);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!currentUser) return;
    
    WebSocketService.connect(
      // On connect
      () => {
        // Subscribe to user's message queue
        WebSocketService.subscribeToUserMessages(
          currentUser.id.toString(), 
          handleNewMessage
        );
        
        // Subscribe to read receipts
        WebSocketService.subscribeToReadReceipts(
          currentUser.id.toString(),
          handleReadReceipt
        );
        
        // Subscribe to call notifications
        WebSocketService.subscribeToCallNotifications(
          currentUser.id.toString(),
          handleCallNotification
        );
        
        // Subscribe to friendship notifications
        WebSocketService.subscribeToFriendshipNotifications(
          currentUser.id.toString(),
          handleFriendshipNotification
        );
      },
      // On error
      (error) => {
        setError('Failed to connect to the messaging server. Please try again.');
      }
    );
    
    // Clean up on unmount
    return () => {
      WebSocketService.unsubscribeAll();
      WebSocketService.disconnect();
    };
  }, [currentUser]);
  
  // Load contacts (only friends)
  useEffect(() => {
    if (!currentUser) return;
    
    // Try authenticated endpoint first, then fall back to test endpoint
    const fetchFriends = async () => {
      try {
        // First try authenticated endpoint
        try {
          const response = await axios.get('/api/friendships/friends', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          
          console.log("Friends response:", response.data);
          processFriends(response.data);
        } catch (authError) {
          console.warn('Using test friends endpoint', authError);
          
          // Fall back to test endpoint for development
          const response = await axios.get('/api/friendships/friends-test', {
            params: { userId: currentUser.id }
          });
          
          console.log("Friends test response:", response.data);
          processFriends(response.data);
        }
      } catch (error) {
        console.error('Error loading friends:', error);
        setContacts([]);
        setError("Failed to load your contacts. Please try again later.");
        setLoading(false);
      }
    };
    
    const processFriends = (friendships) => {
      if (friendships.length === 0) {
        setError("You don't have any friends yet. Go to Discover Users to find and add friends!");
      }
      
      // Process friend list
      const friendsList = friendships.map(friendship => {
        // Determine which user in the friendship is the friend (not the current user)
        const friend = friendship.requester && friendship.requester.id === currentUser.id 
          ? friendship.addressee 
          : friendship.requester;
        
        return {
          id: friend.id,
          username: friend.username,
          online: friend.online,
          profilePictureUrl: friend.profilePictureUrl,
          lastMessageTime: null,
          lastMessage: null,
          unreadCount: 0,
          friendshipId: friendship.id
        };
      });
      
      setContacts(friendsList);
      setLoading(false);
    };
    
    fetchFriends();
  }, [currentUser]);
  
  // Handler for new messages
  const handleNewMessage = (message) => {
    if (selectedContact && (message.senderId === selectedContact.id || message.recipientId === selectedContact.id)) {
      // Add message to current chat
      setMessages(prev => [...prev, message]);
      
      // Mark message as read if it's from selected contact
      if (message.senderId === selectedContact.id) {
        markMessageAsRead(message.id);
      }
    } else {
      // Update contacts with unread message count
      setContacts(prev => 
        prev.map(contact => 
          contact.id === message.senderId 
            ? { 
                ...contact, 
                lastMessage: message.content, 
                lastMessageTime: message.timestamp,
                unreadCount: contact.unreadCount + 1 
              }
            : contact
        )
      );
      
      setUnreadCount(prev => prev + 1);
    }
  };
  
  // Handler for read receipts
  const handleReadReceipt = (receipt) => {
    // Update message as read
    setMessages(prev => 
      prev.map(message => 
        message.id === receipt.messageId 
          ? { ...message, read: true }
          : message
      )
    );
  };
  
  // Handler for call notifications
  const handleCallNotification = (callData) => {
    if (callData.status === 'RINGING' && callData.callerId !== currentUser.id) {
      // Incoming call
      setCurrentCall(callData);
      setCallDialogOpen(true);
    } else if (['COMPLETED', 'REJECTED', 'MISSED'].includes(callData.status)) {
      // Call ended
      if (callDialogOpen && currentCall && currentCall.id === callData.id) {
        setCallDialogOpen(false);
        setCurrentCall(null);
      }
    }
  };
  
  // Handler for friendship notifications
  const handleFriendshipNotification = (notification) => {
    if (notification.type === 'FRIEND_REQUEST') {
      setFriendRequestCount(prev => prev + 1);
      setNotifications(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'FRIEND_REQUEST',
          message: `${notification.friendship.requester.username} sent you a friend request`,
          read: false,
          timestamp: new Date()
        }
      ]);
    } else if (notification.type === 'FRIEND_ACCEPTED') {
      // Add new friend to contacts
      const newFriend = notification.friendship.addressee.id === currentUser.id
        ? notification.friendship.requester
        : notification.friendship.addressee;
        
      setContacts(prev => [
        ...prev,
        {
          id: newFriend.id,
          username: newFriend.username,
          online: newFriend.online,
          profilePictureUrl: newFriend.profilePictureUrl,
          lastMessageTime: null,
          lastMessage: null,
          unreadCount: 0,
          friendshipId: notification.friendship.id
        }
      ]);
      
      setNotifications(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'FRIEND_ACCEPTED',
          message: `${newFriend.username} accepted your friend request`,
          read: false,
          timestamp: new Date()
        }
      ]);
    }
  };
  
  // Load messages when selecting a contact
  useEffect(() => {
    if (!selectedContact) return;
    
    setLoading(true);
    
    // Load messages using updated MessageService
    MessageService.getConversation(selectedContact.id)
      .then(response => {
        setMessages(response);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading messages:', error);
        setError('Failed to load messages. Only friends can send messages to each other.');
        setMessages([]);
        setLoading(false);
      });
      
    // Load files
    FileService.getFilesBetweenUsers(currentUser.id, selectedContact.id)
      .then(response => {
        setFiles(response);
      })
      .catch(error => {
        console.error('Error loading files:', error);
        setFiles([]);
      });
      
    // Mark unread messages as read
    setContacts(prev => 
      prev.map(contact => 
        contact.id === selectedContact.id 
          ? { ...contact, unreadCount: 0 }
          : contact
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - (selectedContact.unreadCount || 0)));
    
    // Close drawer on mobile
    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [selectedContact, currentUser?.id]);
  
  // Send a message
  const handleSendMessage = async (messageData) => {
    if (!selectedContact) return;
    
    try {
      // Check if users are friends first
      const friendshipStatus = await MessageService.checkFriendshipStatus(selectedContact.id);
      
      if (!friendshipStatus.areFriends) {
        setError("You can only send messages to your friends. Send a friend request first.");
        return;
      }
      
      // Prepare message object
      const messageContent = messageData.content;
      
      // Send message using the updated MessageService
      const savedMessage = await MessageService.sendMessage(selectedContact.id, messageContent);
      
      // Update local state 
      const newMessage = {
        content: messageContent,
        encrypted: messageData.encrypted,
        senderId: currentUser.id,
        recipientId: selectedContact.id,
        timestamp: new Date().toISOString(),
        read: false,
        id: savedMessage?.id || Date.now() // Use API response ID if available, otherwise generate temporary ID
      };
      
      // Send via WebSocket
      WebSocketService.sendMessage(newMessage);
      
      // Optimistically add to UI
      setMessages(prev => [...prev, newMessage]);
      
      // Update contact's last message
      setContacts(prev => 
        prev.map(contact => 
          contact.id === selectedContact.id 
            ? { 
                ...contact, 
                lastMessage: newMessage.encrypted ? '[Encrypted Message]' : newMessage.content,
                lastMessageTime: newMessage.timestamp
              }
            : contact
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setError(error.response?.data?.error || "Failed to send message. Please try again.");
    }
  };
  
  // Mark message as read
  const markMessageAsRead = (messageId) => {
    const receipt = {
      messageId,
      senderId: selectedContact.id,
      recipientId: currentUser.id
    };
    
    WebSocketService.sendReadReceipt(receipt);
    MessageService.markAsRead(messageId);
  };
  
  // Start a call
  const handleStartCall = (contactId, type) => {
    CallService.initiateCall(currentUser.id, contactId, type)
      .then(response => {
        setCurrentCall(response);
        setCallDialogOpen(true);
      })
      .catch(error => {
        console.error('Error starting call:', error);
        setError('Failed to start call. Please try again.');
      });
  };
  
  // Handle file upload
  const handleFileUpload = (file, recipientId, encrypt, encryptionKey) => {
    if (!file) return;
    
    FileService.uploadFile(file, currentUser.id, recipientId, encrypt, encryptionKey)
      .then(response => {
        // Add file to list
        setFiles(prev => [...prev, response]);
      })
      .catch(error => {
        console.error('Error uploading file:', error);
        setError('Failed to upload file. Please try again.');
      });
  };
  
  // Handle call status change
  const handleCallStatusChange = (status) => {
    if (!currentCall) return;
    
    if (status === 'COMPLETED') {
      CallService.endCall(currentCall.id);
    } else if (status === 'ONGOING') {
      CallService.answerCall(currentCall.id);
    } else if (status === 'REJECTED') {
      CallService.rejectCall(currentCall.id);
    }
  };
  
  // Navigate to friends page to add more contacts
  const handleAddFriends = () => {
    navigate('/users');
  };
  
  // Calculate total unread count for the header
  const totalUnreadCount = contacts.reduce(
    (sum, contact) => sum + (contact.unreadCount || 0), 
    0
  );
  
  if (!isAuthenticated && !loading) {
    return null; // The useEffect will redirect to login
  }
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode}
        unreadCount={totalUnreadCount}
        onMenuClick={() => setDrawerOpen(!drawerOpen)}
      />
      
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Contact List - persistent on desktop, drawer on mobile */}
        {isMobile ? (
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
              },
            }}
          >
            <ContactList 
              contacts={contacts}
              selectedContactId={selectedContact?.id}
              onSelectContact={(contact) => setSelectedContact(contact)}
              onAddFriends={handleAddFriends}
            />
          </Drawer>
        ) : (
          <Box
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              borderRight: 1,
              borderColor: 'divider',
              overflow: 'auto'
            }}
          >
            <ContactList 
              contacts={contacts}
              selectedContactId={selectedContact?.id}
              onSelectContact={(contact) => setSelectedContact(contact)}
              onAddFriends={handleAddFriends}
            />
          </Box>
        )}
        
        {/* Chat Window */}
        <Box sx={{ flexGrow: 1, p: 0 }}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%'
            }}>
              <CircularProgress />
            </Box>
          ) : selectedContact ? (
            <ChatWindow
              contact={selectedContact}
              messages={messages}
              files={files}
              userId={currentUser?.id}
              onSendMessage={handleSendMessage}
              onStartCall={handleStartCall}
              onFileUpload={handleFileUpload}
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%',
              p: 3
            }}>
              <Typography variant="h5" gutterBottom>
                Welcome to Messenger
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 2, textAlign: 'center' }}>
                {contacts.length > 0 ? 
                  'Select a contact to start a conversation' : 
                  'You don\'t have any contacts yet. Add friends to start chatting!'}
              </Typography>
              
              {contacts.length === 0 && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleAddFriends}
                >
                  Find Friends
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Call Dialog */}
      <CallDialog 
        open={callDialogOpen}
        onClose={() => {
          setCallDialogOpen(false);
          setCurrentCall(null);
        }}
        callData={currentCall}
        currentUser={currentUser}
        onCallStatusChange={handleCallStatusChange}
      />
      
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError('')} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatPage;
