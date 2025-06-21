import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Paper, Typography, Divider, TextField, IconButton,
  Avatar, Tooltip, CircularProgress, Stack
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CallIcon from '@mui/icons-material/Call';
import VideocamIcon from '@mui/icons-material/Videocam';
import LockIcon from '@mui/icons-material/Lock';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { encryptMessage, decryptMessage, generateAESKey } from '../utils/encryption';

const MessageBubble = ({ message, isOwnMessage, encryptionKey }) => {
  const [decryptedContent, setDecryptedContent] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  
  useEffect(() => {
    if (message.encrypted && encryptionKey) {
      setDecrypting(true);
      try {
        const content = decryptMessage(message.content, encryptionKey);
        setDecryptedContent(content || 'Failed to decrypt message');
      } catch (error) {
        console.error('Decryption error:', error);
        setDecryptedContent('Failed to decrypt message');
      } finally {
        setDecrypting(false);
      }
    }
  }, [message, encryptionKey]);
  
  const displayContent = message.encrypted ? decryptedContent : message.content;
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      {!isOwnMessage && (
        <Avatar sx={{ width: 32, height: 32, mr: 1, mt: 1 }}>
          {message.senderName?.charAt(0).toUpperCase() || '?'}
        </Avatar>
      )}
      <Box>
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            borderRadius: 2,
            maxWidth: '70%',
            backgroundColor: isOwnMessage ? 'primary.main' : 'background.paper',
            color: isOwnMessage ? 'white' : 'text.primary',
          }}
        >
          {decrypting ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="body1">Decrypting...</Typography>
            </Box>
          ) : (
            <Typography variant="body1">{displayContent}</Typography>
          )}
          
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: 'right',
              mt: 0.5,
              color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary'
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {message.read && isOwnMessage && ' ✓✓'}
            {message.encrypted && (
              <LockIcon sx={{ fontSize: 12, ml: 0.5, verticalAlign: 'middle' }} />
            )}
          </Typography>
        </Paper>
        
        {message.selfDestructTime && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              textAlign: isOwnMessage ? 'right' : 'left',
              mt: 0.5,
              color: 'error.main'
            }}
          >
            Self-destructs in {new Date(message.selfDestructTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        )}
      </Box>
      {isOwnMessage && (
        <Avatar sx={{ width: 32, height: 32, ml: 1, mt: 1 }}>
          {message.senderName?.charAt(0).toUpperCase() || '?'}
        </Avatar>
      )}
    </Box>
  );
};

const FilePreview = ({ file, isOwnFile, downloadUrl }) => {
  const getFileIcon = () => {
    if (file.contentType.startsWith('image/')) {
      return <ImageIcon sx={{ fontSize: 40 }} />;
    } else if (file.contentType === 'application/pdf') {
      return <PictureAsPdfIcon sx={{ fontSize: 40 }} />;
    } else {
      return <InsertDriveFileIcon sx={{ fontSize: 40 }} />;
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnFile ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      {!isOwnFile && (
        <Avatar sx={{ width: 32, height: 32, mr: 1, mt: 1 }}>
          {file.senderName?.charAt(0).toUpperCase() || '?'}
        </Avatar>
      )}
      <Paper
        elevation={1}
        sx={{
          p: 1.5,
          borderRadius: 2,
          maxWidth: '70%',
          backgroundColor: isOwnFile ? 'primary.main' : 'background.paper',
          color: isOwnFile ? 'white' : 'text.primary',
        }}
      >
        <Box 
          component="a" 
          href={downloadUrl} 
          download
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          {getFileIcon()}
          <Box sx={{ ml: 1 }}>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {file.filename}
            </Typography>
            <Typography variant="caption" color={isOwnFile ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>
              {(file.size / 1024).toFixed(1)} KB
              {file.encrypted && (
                <LockIcon sx={{ fontSize: 12, ml: 0.5, verticalAlign: 'middle' }} />
              )}
            </Typography>
          </Box>
        </Box>
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            textAlign: 'right',
            mt: 0.5,
            color: isOwnFile ? 'rgba(255,255,255,0.7)' : 'text.secondary'
          }}
        >
          {new Date(file.uploadTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Paper>
      {isOwnFile && (
        <Avatar sx={{ width: 32, height: 32, ml: 1, mt: 1 }}>
          {file.senderName?.charAt(0).toUpperCase() || '?'}
        </Avatar>
      )}
    </Box>
  );
};

const ChatWindow = ({ 
  contact, 
  messages = [], 
  files = [],
  userId, 
  onSendMessage,
  onStartCall,
  onFileUpload
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Generate a unique encryption key for this conversation
  const [encryptionKey] = useState(() => {
    const storedKey = localStorage.getItem(`chat_key_${contact?.id}`);
    if (storedKey) return storedKey;
    
    const newKey = generateAESKey();
    localStorage.setItem(`chat_key_${contact?.id}`, newKey);
    return newKey;
  });
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const messageContent = isEncrypted 
      ? encryptMessage(newMessage, encryptionKey) 
      : newMessage;
    
    onSendMessage({
      content: messageContent,
      encrypted: isEncrypted,
      senderId: userId,
      timestamp: new Date().toISOString(),
      selfDestructTime: null // Add logic for self-destruct if needed
    }, contact.id);
    
    setNewMessage('');
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // Reset file input after sending message
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear file input reference
    fileInputRef.current = null;
    
  };
  
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0], contact.id, isEncrypted, encryptionKey);
    }
  };
  
  const handleStartCall = (type) => {
    onStartCall(contact.id, type);
  };
  
  // Sort messages and files by timestamp
  const allItems = [
    ...messages.map(m => ({ ...m, type: 'message', timestamp: new Date(m.timestamp) })),
    ...files.map(f => ({ ...f, type: 'file', timestamp: new Date(f.uploadTime) }))
  ].sort((a, b) => a.timestamp - b.timestamp);
  
  if (!contact) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        p: 3
      }}>
        <Typography variant="h6" color="text.secondary">
          Select a contact to start messaging
        </Typography>
      </Box>
    );
  }
  
  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        borderBottom: 1, 
        borderColor: 'divider'
      }}>
        <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
          {contact.username.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">
            {contact.username}
            {contact.online && (
              <Box 
                component="span" 
                sx={{ 
                  display: 'inline-block',
                  ml: 1,
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  backgroundColor: 'success.main'
                }}
              />
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {contact.online ? 'Online' : 'Offline'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Voice Call">
            <IconButton onClick={() => handleStartCall('AUDIO')}>
              <CallIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Video Call">
            <IconButton onClick={() => handleStartCall('VIDEO')}>
              <VideocamIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
      
      {/* Messages */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {allItems.length === 0 ? (
          <Box sx={{ 
            flexGrow: 1,
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <LockIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              End-to-end encrypted conversation
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Send a message to start chatting
            </Typography>
          </Box>
        ) : (
          allItems.map((item) => (
            item.type === 'message' ? (
              <MessageBubble 
                key={`msg-${item.id}`}
                message={item} 
                isOwnMessage={item.senderId === userId}
                encryptionKey={encryptionKey}
              />
            ) : (
              <FilePreview 
                key={`file-${item.id}`}
                file={item} 
                isOwnFile={item.senderId === userId}
                downloadUrl={`/api/files/download/${item.id}`}
              />
            )
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Message Input */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Tooltip title={isEncrypted ? "End-to-end encrypted" : "Encryption disabled"}>
          <IconButton 
            color={isEncrypted ? 'primary' : 'default'} 
            onClick={() => setIsEncrypted(!isEncrypted)}
          >
            <LockIcon />
          </IconButton>
        </Tooltip>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <IconButton onClick={() => fileInputRef.current.click()}>
          <AttachFileIcon />
        </IconButton>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message"
          size="small"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          sx={{ mx: 1 }}
        />
        <IconButton type="submit" color="primary" disabled={!newMessage.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatWindow;
