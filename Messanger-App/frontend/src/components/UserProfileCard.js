import React from 'react';
import { 
  Card, CardContent, CardActions, Avatar, Box, 
  Typography, Chip, Button, IconButton, Tooltip 
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import EmailIcon from '@mui/icons-material/Email';
import ChatIcon from '@mui/icons-material/Chat';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

/**
 * A reusable user profile card component that shows user information
 * and different action buttons based on friendship status
 */
const UserProfileCard = ({ 
  user, 
  friendshipStatus, 
  onSendRequest, 
  onAcceptRequest,
  onRejectRequest,
  onStartChat,
  isCurrentUser,
  showActions = true,
  elevation = 1,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  if (!user) return null;
  
  const getAvatarSize = () => {
    switch(size) {
      case 'small': return { width: 60, height: 60 };
      case 'large': return { width: 120, height: 120 };
      default: return { width: 80, height: 80 }; // medium
    }
  };
  
  // Determine what actions to show based on friendship status
  const renderActions = () => {
    if (!showActions) return null;
    
    if (isCurrentUser) {
      return (
        <Button 
          variant="outlined" 
          color="primary" 
          fullWidth 
          startIcon={<MoreVertIcon />}
          disabled
        >
          Your Profile
        </Button>
      );
    }
    
    switch (friendshipStatus) {
      case 'ACCEPTED':
        return (
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            startIcon={<ChatIcon />}
            onClick={onStartChat}
          >
            Chat Now
          </Button>
        );
      
      case 'PENDING':
        // If the current user is the addressee
        if (user.isAddressee) {
          return (
            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ flex: 1 }}
                startIcon={<CheckIcon />}
                onClick={onAcceptRequest}
              >
                Accept
              </Button>
              <Button 
                variant="outlined" 
                color="error"
                sx={{ flex: 1 }}
                onClick={onRejectRequest}
              >
                Decline
              </Button>
            </Box>
          );
        } else {
          // Current user is the requester
          return (
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth
              startIcon={<AccessTimeIcon />}
              disabled
            >
              Request Sent
            </Button>
          );
        }
      
      case 'REJECTED':
        return (
          <Button 
            variant="outlined" 
            color="primary" 
            fullWidth
            disabled
          >
            Request Declined
          </Button>
        );
      
      default: // NONE
        return (
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            startIcon={<PersonAddIcon />}
            onClick={onSendRequest}
          >
            Add Friend
          </Button>
        );
    }
  };
  
  return (
    <Card 
      elevation={elevation}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6
        },
        position: 'relative'
      }}
    >
      <CardContent 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          textAlign: 'center',
          pt: 3,
          pb: 2,
          flex: 1
        }}
      >
        {friendshipStatus === 'ACCEPTED' && (
          <Chip
            label="Friend"
            color="success"
            size="small"
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
            }}
          />
        )}
        
        {friendshipStatus === 'PENDING' && !user.isAddressee && (
          <Chip
            label="Pending"
            color="warning"
            size="small"
            icon={<AccessTimeIcon fontSize="small" />}
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
            }}
          />
        )}
        
        <Avatar
          alt={user.username}
          src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random&size=256`}
          sx={{ 
            ...getAvatarSize(),
            mb: 2,
            border: theme => `3px solid ${theme.palette.background.paper}`,
            boxShadow: 2
          }}
        />
        
        <Typography variant="h6" gutterBottom>
          {user.username}
        </Typography>
        
        <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title={user.email}>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
              <EmailIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                {user.email}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 2
        }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: user.online ? 'success.main' : 'text.disabled',
              mr: 1
            }}
          />
          <Typography variant="body2" color={user.online ? 'success.main' : 'text.secondary'}>
            {user.online ? 'Online' : 'Offline'}
          </Typography>
        </Box>
      </CardContent>
      
      {showActions && (
        <CardActions sx={{ p: 2, pt: 0, mt: 'auto' }}>
          {renderActions()}
        </CardActions>
      )}
    </Card>
  );
};

export default UserProfileCard;
