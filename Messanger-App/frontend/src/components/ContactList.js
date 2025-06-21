import React, { useState } from 'react';
import {
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Typography, Box, Avatar, Badge, Button, TextField, 
  InputAdornment, IconButton, Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

const ContactList = ({ contacts, selectedContactId, onSelectContact, onAddFriends }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter contacts based on search term
  const filteredContacts = searchTerm
    ? contacts.filter(contact => 
        contact.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : contacts;
  
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Contacts
        </Typography>
        <Tooltip title="Find new friends">
          <IconButton color="primary" onClick={onAddFriends}>
            <PersonAddIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box sx={{ px: 2, pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          variant="outlined"
        />
      </Box>
      
      <Divider />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {filteredContacts.length === 0 ? (
            <ListItem>
              {contacts.length === 0 ? (
                <ListItemText 
                  primary="No contacts" 
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Button 
                        startIcon={<PersonAddIcon />}
                        variant="outlined" 
                        color="primary" 
                        size="small"
                        onClick={onAddFriends}
                      >
                        Find Friends
                      </Button>
                    </Box>
                  } 
                />
              ) : (
                <ListItemText 
                  primary="No matches found" 
                  secondary={`No contacts match "${searchTerm}"`} 
                />
              )}
            </ListItem>
          ) : (
            filteredContacts.map((contact) => (
              <ListItemButton
                key={contact.id}
                selected={selectedContactId === contact.id}
                onClick={() => onSelectContact(contact)}
                sx={{ 
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }
                }}
              >
                <ListItemIcon>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: contact.online ? 'success.main' : 'grey.400',
                        boxShadow: `0 0 0 2px ${(theme) => theme.palette.background.paper}`
                      }
                    }}
                  >
                    {contact.profilePictureUrl ? (
                      <Avatar src={contact.profilePictureUrl} alt={contact.username} />
                    ) : (
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {contact.username.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                  </Badge>
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography 
                        sx={{ 
                          fontWeight: contact.unreadCount > 0 ? 'bold' : 'normal'
                        }}
                      >
                        {contact.username}
                      </Typography>
                      {contact.lastMessageTime && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      )}
                    </Box>
                  } 
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="body2" 
                        noWrap 
                        sx={{ 
                          maxWidth: '180px', 
                          fontWeight: contact.unreadCount > 0 ? 'bold' : 'normal',
                          color: contact.unreadCount > 0 ? 'primary.main' : 'text.secondary'
                        }}
                      >
                        {contact.lastMessage || 'No messages yet'}
                      </Typography>
                      {contact.unreadCount > 0 && (
                        <Badge 
                          badgeContent={contact.unreadCount} 
                          color="primary" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            ))
          )}
        </List>
      </Box>
      
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={onAddFriends}
        >
          Find Friends
        </Button>
      </Box>
    </Box>
  );
};

export default ContactList;
