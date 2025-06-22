import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Button, Box, Menu, MenuItem, Drawer } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MailIcon from '@mui/icons-material/Mail';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PeopleIcon from '@mui/icons-material/People';

const Header = ({ darkMode, toggleDarkMode, unreadCount = 0, notificationCount = 0, onMenuClick }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };
  
  const isMenuOpen = Boolean(anchorEl);

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
          onClick={onMenuClick}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Secure Messenger
        </Typography>
        
        <Box sx={{ display: 'flex' }}>
          {/* Navigation Links */}
          <Button color="inherit" component={Link} to="/chat" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <MailIcon sx={{ mr: 1 }} />
            Chat
          </Button>
          <Button color="inherit" component={Link} to="/discover" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <PersonSearchIcon sx={{ mr: 1 }} />
            Discover
          </Button>
          <Button color="inherit" component={Link} to="/friends" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <PeopleIcon sx={{ mr: 1 }} />
            Friends
          </Button>
          
          {/* Theme toggle */}
          <IconButton color="inherit" onClick={toggleDarkMode}>
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          
          {/* Messages */}
          <IconButton color="inherit">
            <Badge badgeContent={unreadCount} color="error">
              <MailIcon />
            </Badge>
          </IconButton>
          
          {/* Notifications */}
          <IconButton color="inherit">
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          {/* Profile */}
          <IconButton
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
        </Box>
        
        {/* Profile menu */}
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          keepMounted
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={isMenuOpen}
          onClose={handleMenuClose}
        >
          <MenuItem disabled>
            {currentUser?.username || 'User'}
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
          <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
          <MenuItem onClick={handleLogout}>
            <ExitToAppIcon fontSize="small" sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
