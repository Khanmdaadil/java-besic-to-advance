import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MainNavigation from '../components/MainNavigation';
import ToastNotification from '../components/ToastNotification';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Add custom CSS for hover effects
const styles = {
  hoverCard: {
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
    }
  }
};

const UserDiscoveryPage = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || false
  );
  
  // Add state for current user
  const [currentUser, setCurrentUser] = useState(null);
  
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };
  
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });
  const [users, setUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get or set current user from localStorage
  useEffect(() => {
    // Try to get current user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
      }
    } else {
      // If no user in localStorage, use the first user as default
      axios.get('/api/users/discover-test')
        .then(response => {
          if (response.data && response.data.length > 0) {
            const firstUser = response.data[0];
            setCurrentUser(firstUser);
            localStorage.setItem('currentUser', JSON.stringify(firstUser));
          }
        })
        .catch(err => console.error('Error fetching default user:', err));
    }
  }, []);

  // Debug current user
  useEffect(() => {
    if (currentUser) {
      console.log("Current user:", currentUser);
    }
  }, [currentUser]);

  // Fetch users and friendship status
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Use the test endpoint that doesn't require authentication during development
        const response = await axios.get('/api/users/discover-test');
        
        // If we have a current user, filter them out from the users list
        if (currentUser) {
          const filteredUsers = response.data.filter(user => user.id !== currentUser.id);
          console.log(`Filtered out current user (${currentUser.username}), showing ${filteredUsers.length} other users`);
          setUsers(filteredUsers);
        } else {
          setUsers(response.data);
        }
        
        // Fetch friendship data
        await fetchFriendshipData();
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
        setLoading(false);
      }
    };

    // Only fetch users when currentUser is available
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);
  
  // Debug friendship data whenever it changes
  useEffect(() => {
    console.log("Current friendship requests state:", friendRequests);
  }, [friendRequests]);

  // Send friend request
  const sendFriendRequest = async (userId) => {
    if (!currentUser) {
      console.error('No current user available to send friend request');
      setError('Please wait until your user profile is loaded.');
      return;
    }
    
    // Prevent sending request to self
    if (currentUser.id === userId) {
      setError('You cannot send a friend request to yourself.');
      return;
    }
    
    try {
      console.log(`Sending friend request from user ${currentUser.id} (${currentUser.username}) to user ${userId}`);
      
      // Send the current user ID along with the request to identify who is sending it
      const response = await axios.post(`/api/friendships/request-test/${userId}`, {
        requesterId: currentUser.id
      });
      
      // Check if there was an error response
      if (response.data.status === 'ERROR') {
        setError(response.data.requester.username); // Error message is in username field
        return;
      }
      
      // Update the local state with the new friendship data
      const updatedRequests = { ...friendRequests };
      updatedRequests[userId] = response.data;
      setFriendRequests(updatedRequests);
      
      console.log("Friend request sent successfully:", response.data);
      
      // Fetch updated data to ensure our state is in sync with the server
      // This is important to ensure consistency between the UserDiscoveryPage and FriendRequestsPage
      fetchFriendshipData();
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert('Failed to send friend request. Please try again.');
    }
  };
  
  // Function to fetch friendship data
  const fetchFriendshipData = async () => {
    if (!currentUser) {
      console.log("No current user available, skipping friendship data fetch");
      return;
    }
    
    try {
      console.log(`Fetching friendship data for user ${currentUser.id} (${currentUser.username})...`);
      
      // Use the test endpoint for outgoing requests with current user ID
      const outgoingResponse = await axios.get(`/api/friendships/outgoing-test?userId=${currentUser.id}`);
      console.log("Outgoing requests:", outgoingResponse.data);
      
      // Create a map of addressee ID to friendship for quick lookup
      const requestMap = {};
      outgoingResponse.data.forEach(friendship => {
        if (friendship.addressee && friendship.addressee.id) {
          console.log(`Adding outgoing request for addressee ID ${friendship.addressee.id}`);
          requestMap[friendship.addressee.id] = friendship;
        }
      });
      
      // Use the test endpoint for friends with current user ID
      const friendsResponse = await axios.get(`/api/friendships/friends-test?userId=${currentUser.id}`);
      console.log("Friends:", friendsResponse.data);
      
      friendsResponse.data.forEach(friendship => {
        // For each friendship, figure out who the "other" user is (not the current user)
        const otherUser = friendship.requester.id === currentUser.id ? 
          friendship.addressee : friendship.requester;
        
        if (otherUser && otherUser.id) {
          console.log(`Adding friend for user ID ${otherUser.id}`);
          friendship.status = 'ACCEPTED';
          requestMap[otherUser.id] = friendship;
        }
      });
      
      console.log("Updated friendship map:", requestMap);
      setFriendRequests(requestMap);
    } catch (err) {
      console.error('Error fetching friendship data:', err);
    }
  };

  // Render friend request button based on status
  const renderActionButton = (user) => {
    // Check if this user is in our friendship map
    const friendship = friendRequests[user.id];
    
    if (friendship) {
      console.log("Found friendship status for user:", user.username, friendship.status);
      
      if (friendship.status === 'PENDING') {
        return (
          <button className="btn btn-outline-secondary" disabled style={{borderRadius: '20px'}}>
            <AccessTimeIcon sx={{ mr: 1 }} fontSize="small" /> Request Sent
          </button>
        );
      } else if (friendship.status === 'ACCEPTED') {
        return (
          <Link to="/chat" className="btn btn-success" style={{borderRadius: '20px', textDecoration: 'none'}}>
            <CheckIcon sx={{ mr: 1 }} fontSize="small" /> Message Friend
          </Link>
        );
      } else if (friendship.status === 'REJECTED') {
        return (
          <button 
            className="btn btn-primary"
            onClick={() => sendFriendRequest(user.id)}
            style={{borderRadius: '20px'}}>
            <PersonAddIcon sx={{ mr: 1 }} fontSize="small" /> Send Request Again
          </button>
        );
      }
    }
    
    // For debugging
    console.log("No friendship found for user:", user.username);
    
    return (
      <button 
        className="btn btn-primary"
        onClick={() => sendFriendRequest(user.id)}
        style={{borderRadius: '20px', transition: 'all 0.2s'}}>
        <PersonAddIcon sx={{ mr: 1 }} fontSize="small" /> Add Friend
      </button>
    );
  };

  if (loading) {
    return <div className="d-flex justify-content-center"><div className="spinner-border" role="status"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainNavigation darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <div className="container mt-4">
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h2 className="card-title mb-4">
              <PersonAddIcon sx={{ mr: 1, verticalAlign: 'bottom', color: '#2196f3' }} />
              Discover New Friends
            </h2>
          
          {users.length === 0 ? (
            <div className="alert alert-info">No users found.</div>
          ) : (
            <div className="row g-4">
              {users.map(user => (
                <div key={user.id} className="col-md-6 col-lg-4">
                  <div className="card h-100 shadow-sm border-0" style={styles.hoverCard}>
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <div className="position-relative me-3">
                          <img 
                            src={user.profilePictureUrl || 'https://via.placeholder.com/50'} 
                            alt={`${user.username}'s profile`} 
                            className="rounded-circle border border-2 border-light shadow-sm"
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                          />
                          <span
                            className={`position-absolute bottom-0 end-0 translate-middle p-1 rounded-circle ${user.online ? 'bg-success' : 'bg-secondary'}`}
                            style={{ width: '14px', height: '14px', border: '2px solid white' }}
                          />
                        </div>
                        <div>
                          <h5 className="card-title mb-0 fw-bold">{user.username}</h5>
                          <small className="text-muted">{user.email}</small>
                        </div>
                      </div>
                      
                      <div className="d-grid mt-3">
                        {renderActionButton(user)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default UserDiscoveryPage;
