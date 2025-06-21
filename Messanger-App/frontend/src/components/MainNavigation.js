import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Badge, Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import ChatIcon from '@mui/icons-material/Chat';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PeopleIcon from '@mui/icons-material/People';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircle from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';

const StyledNavLink = styled(Button)(({ theme, active }) => ({
  color: active ? theme.palette.primary.main : 'inherit',
  fontWeight: active ? 'bold' : 'normal',
  marginRight: theme.spacing(1),
  borderBottom: active ? `2px solid ${theme.palette.primary.main}` : 'none',
  borderRadius: 0,
  paddingBottom: theme.spacing(1),
  '&:hover': {
    backgroundColor: 'transparent',
    borderBottom: active ? `2px solid ${theme.palette.primary.main}` : `2px solid ${theme.palette.action.hover}`,
  },
}));

const MainNavigation = ({ darkMode, toggleDarkMode, notificationCount = 0 }) => {
  const location = useLocation();
  
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component={Link} to="/chat" sx={{ 
          flexGrow: 1, 
          textDecoration: 'none',
          color: 'inherit',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center'
        }}>
          SecureChat
        </Typography>
        
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <StyledNavLink 
            component={Link} 
            to="/chat" 
            startIcon={<ChatIcon />}
            active={location.pathname.startsWith('/chat') ? 1 : 0}
          >
            Chat
          </StyledNavLink>
          
          <StyledNavLink 
            component={Link} 
            to="/discover" 
            startIcon={<PersonSearchIcon />}
            active={location.pathname === '/discover' ? 1 : 0}
          >
            Discover
          </StyledNavLink>
          
          <StyledNavLink 
            component={Link} 
            to="/friends" 
            startIcon={<PeopleIcon />}
            active={location.pathname === '/friends' ? 1 : 0}
          >
            Friends
          </StyledNavLink>
        </Box>
        
        <Box sx={{ display: 'flex' }}>
          <IconButton color="inherit" onClick={toggleDarkMode} sx={{ ml: 1 }}>
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          
          <IconButton color="inherit" sx={{ ml: 1 }}>
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <IconButton color="inherit" sx={{ ml: 1 }}>
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default MainNavigation;
