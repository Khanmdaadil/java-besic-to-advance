import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Grid, Card, CardContent, CardMedia, CardActions, Avatar,
  Typography, Button, Badge, Tabs, Tab, Box, Divider, 
  Chip, CircularProgress, Alert, Paper
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ChatIcon from '@mui/icons-material/Chat';
import MainNavigation from '../components/MainNavigation';
import ToastNotification from '../components/ToastNotification';
import { useAuth } from '../contexts/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const FriendRequestsPage = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  
  // Get authentication context
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Ensure user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/friends' } });
    }
  }, [isAuthenticated, navigate]);
  
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || false
  );
  
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };
  
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#f50057',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 40px -12px rgba(0,0,0,0.3)',
            },
          },
        },
      },
    },
  });

  // Fetch friend requests and friends using authenticated endpoints
  const fetchFriendData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use proper authenticated endpoints
      const pendingResponse = await axios.get('/api/friendships/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPendingRequests(pendingResponse.data);
      
      // Get outgoing requests
      const outgoingResponse = await axios.get('/api/friendships/outgoing', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setOutgoingRequests(outgoingResponse.data);
      
      // Get friends
      const friendsResponse = await axios.get('/api/friendships/friends', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setFriends(friendsResponse.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching friend data:', err);
      setToast({
        open: true,
        message: 'Failed to load friend data. Please try again later.',
        severity: 'error'
      });
      setError('Failed to load friend data. Please try again later.');
      setLoading(false);
      
      // Fallback to test endpoints for development purposes if authentication fails
      try {
        const pendingResponse = await axios.get('/api/friendships/pending-test');
        setPendingRequests(pendingResponse.data);
        
        const outgoingResponse = await axios.get('/api/friendships/outgoing-test');
        setOutgoingRequests(outgoingResponse.data);
        
        const friendsResponse = await axios.get('/api/friendships/friends-test');
        setFriends(friendsResponse.data);
        
        setLoading(false);
        console.log('Successfully fetched data using test endpoints');
      } catch (testErr) {
        console.error('Both authenticated and test endpoints failed:', testErr);
      }
    }
  };

  useEffect(() => {
    fetchFriendData();
  }, []);
  
  // Debug data whenever it changes
  useEffect(() => {
    console.log("Pending requests:", pendingRequests);
    console.log("Outgoing requests:", outgoingRequests);
    console.log("Friends:", friends);
  }, [pendingRequests, outgoingRequests, friends]);

  // Accept friend request using authenticated endpoint
  const acceptFriendRequest = async (requestId) => {
    try {
      await axios.post(`/api/friendships/${requestId}/accept`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Show success toast
      setToast({
        open: true,
        message: 'Friend request accepted!',
        severity: 'success'
      });
      
      // Fetch the latest data to ensure UI is in sync with the server
      fetchFriendData();
      
      // Move to the friends tab
      setTabValue(2);
    } catch (err) {
      console.error('Error accepting friend request:', err);
      setToast({
        open: true,
        message: 'Failed to accept friend request. Please try again.',
        severity: 'error'
      });
      
      // Fallback to test endpoint
      try {
        await axios.post(`/api/friendships/${requestId}/accept-test`);
        fetchFriendData();
        setToast({
          open: true,
          message: 'Friend request accepted! (Test mode)',
          severity: 'success'
        });
        setTabValue(2);
      } catch (testErr) {
        console.error('Test endpoint also failed:', testErr);
      }
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (requestId) => {
    try {
      await axios.post(`/api/friendships/${requestId}/reject`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setToast({
        open: true,
        message: 'Friend request declined',
        severity: 'info'
      });
      
      // Fetch the latest data to ensure UI is in sync with the server
      fetchFriendData();
    } catch (err) {
      console.error('Error rejecting friend request:', err);
      setToast({
        open: true,
        message: 'Failed to decline friend request. Please try again.',
        severity: 'error'
      });
      
      // Fallback to test endpoint
      try {
        await axios.post(`/api/friendships/${requestId}/reject-test`);
        fetchFriendData();
        setToast({
          open: true,
          message: 'Friend request declined (Test mode)',
          severity: 'info'
        });
      } catch (testErr) {
        console.error('Test endpoint also failed:', testErr);
      }
    }
  };

  // Handle toast close
  const handleCloseToast = () => {
    setToast({...toast, open: false});
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Render user information with Material UI
  const renderUserInfo = (user) => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', mr: 2 }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: user.online ? '#4caf50' : '#bdbdbd',
              width: 10,
              height: 10,
              borderRadius: '50%',
              border: '2px solid white'
            }
          }}
        >
          <Avatar
            src={user.profilePictureUrl || 'https://via.placeholder.com/60'}
            alt={`${user.username}'s profile`}
            sx={{ 
              width: 56, 
              height: 56, 
              boxShadow: 1,
              bgcolor: !user.profilePictureUrl ? (theme.palette.mode === 'dark' ? '#1e88e5' : '#2196f3') : 'inherit' 
            }}
          />
        </Badge>
      </Box>
      <Box>
        <Typography variant="subtitle1" fontWeight="bold">
          {user.username}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.email}
        </Typography>
      </Box>
    </Box>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, py: 8 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
    }

    switch (tabValue) {
      case 0: // Pending requests
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'medium' }}>
              Friend Requests
            </Typography>
            {pendingRequests.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6, 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: 0.8
              }}>
                <AccessTimeIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  No pending friend requests
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {pendingRequests.map(request => (
                  <Grid item xs={12} md={6} key={request.id}>
                    <Card elevation={1}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          {renderUserInfo(request.requester)}
                          <Typography variant="caption" color="text.secondary">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <CardActions sx={{ justifyContent: 'space-around', pt: 1 }}>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<CheckIcon />}
                            onClick={() => acceptFriendRequest(request.id)}
                            sx={{ borderRadius: '20px', flex: 1, mr: 1 }}>
                            Accept
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            startIcon={<CloseIcon />}
                            onClick={() => rejectFriendRequest(request.id)}
                            sx={{ borderRadius: '20px', flex: 1, ml: 1 }}>
                            Decline
                          </Button>
                        </CardActions>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      case 1: // Outgoing requests
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'medium' }}>
              Sent Requests
            </Typography>
            {outgoingRequests.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6, 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: 0.8
              }}>
                <AccessTimeIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  You haven't sent any friend requests
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {outgoingRequests.map(request => (
                  <Grid item xs={12} md={6} key={request.id}>
                    <Card elevation={1}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          {renderUserInfo(request.addressee)}
                          <Typography variant="caption" color="text.secondary">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                          <Chip
                            icon={<AccessTimeIcon fontSize="small" />}
                            label="Awaiting Response"
                            color="default"
                            variant="outlined"
                            sx={{ borderRadius: '16px' }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      case 2: // Friends list
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'medium' }}>
              My Friends
            </Typography>
            {friends.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6, 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: 0.8
              }}>
                <PeopleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  You don't have any friends yet
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PersonAddIcon />}
                  component={Link}
                  to="/discover"
                  sx={{ borderRadius: '20px' }}
                >
                  Discover New Friends
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {friends.map(friendship => {
                  // Determine which user is the friend (not the current user)
                  const currentUserId = currentUser?.id || localStorage.getItem('userId');
                  const friend = 
                    friendship.requester && friendship.requester.id === currentUserId
                      ? friendship.addressee
                      : friendship.requester;
                    
                  if (!friend) return null;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={friendship.id}>
                      <Card elevation={1} sx={{ height: '100%' }}>
                        <CardContent sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          textAlign: 'center',
                          pb: 1
                        }}>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            sx={{
                              '& .MuiBadge-badge': {
                                backgroundColor: friend.online ? '#4caf50' : '#bdbdbd',
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                border: '3px solid white'
                              },
                              mb: 2
                            }}
                          >
                            <Avatar
                              src={friend.profilePictureUrl || `https://ui-avatars.com/api/?name=${friend.username}&background=random&size=128`}
                              alt={`${friend.username}'s profile`}
                              sx={{ width: 100, height: 100, boxShadow: 2 }}
                            />
                          </Badge>
                          <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                            {friend.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {friend.email}
                          </Typography>
                          
                          <Button 
                            variant="contained" 
                            color="primary"
                            startIcon={<ChatIcon />}
                            component={Link}
                            to={`/chat?friendId=${friend.id}`}
                            fullWidth
                            sx={{ borderRadius: '20px', mt: 'auto' }}>
                            Chat Now
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainNavigation darkMode={darkMode} toggleDarkMode={toggleDarkMode} notificationCount={pendingRequests.length} />
      
      {/* Toast notifications */}
      <ToastNotification
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
        autoHideDuration={5000}
      />
      
      <Container sx={{ mt: 4, mb: 6 }}>
        <Paper elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PeopleIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 30 }} />
              <Typography variant="h4" component="h1" fontWeight="medium">
                Friend Connections
              </Typography>
            </Box>
            
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                mb: 4,
                '& .MuiTab-root': {
                  borderRadius: '20px',
                  minHeight: '48px',
                  mx: 0.5
                }
              }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Incoming Requests
                    {pendingRequests.length > 0 && (
                      <Chip 
                        label={pendingRequests.length} 
                        color="error" 
                        size="small" 
                        sx={{ ml: 1, height: 20, minWidth: 20 }} 
                      />
                    )}
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Sent Requests
                    {outgoingRequests.length > 0 && (
                      <Chip 
                        label={outgoingRequests.length} 
                        color="primary" 
                        size="small" 
                        sx={{ ml: 1, height: 20, minWidth: 20 }} 
                      />
                    )}
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon sx={{ mr: 0.5 }} /> 
                    My Friends
                    {friends.length > 0 && (
                      <Chip 
                        label={friends.length} 
                        color="success" 
                        size="small" 
                        sx={{ ml: 1, height: 20, minWidth: 20 }} 
                      />
                    )}
                  </Box>
                } 
              />
            </Tabs>
            
            <Box sx={{ p: 1 }}>
              {renderTabContent()}
            </Box>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default FriendRequestsPage;
