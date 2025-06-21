import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  IconButton, Box, Typography, Grid, CircularProgress, Alert, Snackbar
} from '@mui/material';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import Peer from 'simple-peer';
import WebSocketService from '../services/WebSocketService';
import CallService from '../services/CallService';

const CallDialog = ({ 
  open, 
  onClose, 
  callData, 
  currentUser,
  onCallStatusChange
}) => {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideo, setIsVideo] = useState(callData?.type === 'VIDEO');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callData?.type === 'VIDEO');
  const [isConnecting, setIsConnecting] = useState(true);
  const [isInitiator, setIsInitiator] = useState(callData?.callerId === currentUser?.id);
  const [peer, setPeer] = useState(null);
  const [error, setError] = useState(null);
  const [iceServers, setIceServers] = useState([]);
  const [connectionQuality, setConnectionQuality] = useState('good');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Fetch ICE servers on component mount
  useEffect(() => {
    const getIceServersConfig = async () => {
      try {
        const servers = await CallService.getIceServers();
        setIceServers(servers);
      } catch (error) {
        console.error('Failed to get ICE server configuration:', error);
        setError('Failed to get call configuration');
      }
    };
    
    getIceServersConfig();
  }, []);
  
  // Initialize media stream when the dialog opens
  useEffect(() => {
    if (!open) return;
    
    const constraints = {
      video: isVideo,
      audio: true
    };
    
    // Media access timeout handling
    const mediaTimeout = setTimeout(() => {
      setError('Taking too long to access camera/microphone. Please check permissions.');
    }, 10000);
    
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        clearTimeout(mediaTimeout);
        setStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Only initialize peer after we have ICE servers
        if (iceServers.length > 0) {
          initializePeer(stream);
        }
      })
      .catch((error) => {
        clearTimeout(mediaTimeout);
        console.error('Error accessing media devices:', error);
        setError(`Could not access ${isVideo ? 'camera' : 'microphone'}. Please check permissions.`);
        onClose();
      });
      
    return () => {
      // Clean up streams
      clearTimeout(mediaTimeout);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, [open, iceServers]);
  
  // Setup WebRTC peer
  const initializePeer = (stream) => {
    const newPeer = new Peer({
      initiator: isInitiator,
      trickle: true,
      stream: stream,
      config: {
        iceServers: iceServers
      }
    });
    
    // Set up WebRTC signaling events
    newPeer.on('signal', (data) => {
      // Send signal via WebSocket
      const signal = {
        type: isInitiator ? 'offer' : 'answer',
        targetUserId: isInitiator ? callData.receiverId.toString() : callData.callerId.toString(),
        senderId: currentUser.id.toString(),
        callId: callData.id,
        data: data
      };
      
      // Send the appropriate signal based on its type
      if (data.type === 'offer') {
        WebSocketService.sendOffer(signal);
      } else if (data.type === 'answer') {
        WebSocketService.sendAnswer(signal);
      } else if (data.candidate) {
        WebSocketService.sendIceCandidate(signal);
      }
    });
    
    newPeer.on('connect', () => {
      setIsConnecting(false);
      onCallStatusChange('ONGOING');
      console.log('Peer connection established successfully');
    });
    
    newPeer.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      
      // Monitor audio levels to check connection quality
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(remoteStream);
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.85;
      microphone.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      // Periodically check audio levels to determine connection quality
      const audioLevelInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Update connection quality based on audio levels
        if (average < 10) {
          setConnectionQuality('poor');
        } else if (average < 30) {
          setConnectionQuality('fair');
        } else {
          setConnectionQuality('good');
        }
      }, 2000);
      
      // Clean up on unmount
      return () => clearInterval(audioLevelInterval);
    });
    
    newPeer.on('close', () => {
      console.log('Peer connection closed');
      onClose();
    });
    
    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
      setError(`Connection error: ${err.message}`);
      setTimeout(() => {
        onClose();
      }, 3000);
    });
    
    // Monitor ICE connection state changes
    newPeer._pc.oniceconnectionstatechange = () => {
      const iceState = newPeer._pc.iceConnectionState;
      console.log('ICE connection state:', iceState);
      
      if (iceState === 'disconnected' || iceState === 'failed') {
        setConnectionQuality('poor');
        setError('Connection quality is poor. Try turning off video to improve call quality.');
      } else if (iceState === 'checking') {
        setConnectionQuality('fair');
      } else if (iceState === 'connected' || iceState === 'completed') {
        setConnectionQuality('good');
      }
    };
    
    setPeer(newPeer);
    
    // Set up signal handler
    const handleWebRTCSignal = (signal) => {
      if (signal.callId === callData.id) {
        try {
          newPeer.signal(signal.data);
        } catch (error) {
          console.error('Error applying WebRTC signal:', error);
        }
      }
    };
    
    // Subscribe to WebRTC signals
    WebSocketService.subscribeToWebRTC(currentUser.id.toString(), handleWebRTCSignal);
  };
  
  // Handle toggle audio
  const toggleMute = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Handle toggle video
  const toggleVideo = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };
  
  // Handle call end
  const handleEndCall = () => {
    if (peer) {
      peer.destroy();
    }
    
    // Send hangup signal
    const signal = {
      type: 'hangup',
      targetUserId: isInitiator ? callData.receiverId.toString() : callData.callerId.toString(),
      senderId: currentUser.id.toString(),
      callId: callData.id
    };
    
    WebSocketService.sendHangup(signal);
    onCallStatusChange('COMPLETED');
    onClose();
  };
  
  if (!callData) return null;
  
  return (
    <Dialog 
      open={open} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ 
        sx: { 
          bgcolor: 'background.default',
          height: '80vh'
        } 
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          {isConnecting ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              {isInitiator ? 'Calling...' : 'Incoming call...'}
            </Box>
          ) : (
            isVideo ? 'Video Call' : 'Voice Call'
          )}
        </Box>
        
        {/* Connection quality indicator */}
        {!isConnecting && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              width: 12, 
              height: 12, 
              borderRadius: '50%', 
              bgcolor: connectionQuality === 'good' ? 'success.main' :
                      connectionQuality === 'fair' ? 'warning.main' : 'error.main',
              mr: 1
            }} />
            <Typography variant="caption">
              {connectionQuality === 'good' ? 'Good' :
              connectionQuality === 'fair' ? 'Fair' : 'Poor'}
            </Typography>
          </Box>
        )}
      </DialogTitle>
      
      {/* Error message display */}
      {error && (
        <Alert 
          severity="warning" 
          onClose={() => setError(null)}
          sx={{ mx: 2 }}
        >
          {error}
        </Alert>
      )}
      <DialogContent sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        p: 0,
        position: 'relative',
        flexGrow: 1
      }}>
        {/* Remote video (full screen) */}
        {isVideo && (
          <Box sx={{ 
            bgcolor: 'black', 
            width: '100%', 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        )}
        
        {/* Local video (picture-in-picture) */}
        {isVideo && (
          <Box sx={{ 
            position: 'absolute', 
            bottom: 16, 
            right: 16,
            width: 200,
            height: 150,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: 3
          }}>
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        )}
        
        {/* Audio call UI */}
        {!isVideo && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3
              }}
            >
              <Typography variant="h3" color="white">
                {callData.receiverName?.charAt(0) || '?'}
              </Typography>
            </Box>
            <Typography variant="h5" gutterBottom>
              {callData.receiverName}
            </Typography>
            <Box>
              <audio ref={localVideoRef} autoPlay muted />
              <audio ref={remoteVideoRef} autoPlay />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {isConnecting ? 'Connecting...' : 'Connected'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <IconButton 
          onClick={toggleMute} 
          sx={{ 
            bgcolor: isMuted ? 'error.main' : 'action.selected',
            color: 'white',
            '&:hover': {
              bgcolor: isMuted ? 'error.dark' : 'action.selected',
            },
            mx: 1
          }}
        >
          {isMuted ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
        
        {isVideo && (
          <IconButton 
            onClick={toggleVideo} 
            sx={{ 
              bgcolor: !isVideoEnabled ? 'error.main' : 'action.selected',
              color: 'white',
              '&:hover': {
                bgcolor: !isVideoEnabled ? 'error.dark' : 'action.selected',
              },
              mx: 1
            }}
          >
            {!isVideoEnabled ? <VideocamOffIcon /> : <VideocamIcon />}
          </IconButton>
        )}
        
        <IconButton 
          onClick={handleEndCall} 
          sx={{ 
            bgcolor: 'error.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'error.dark',
            },
            mx: 1
          }}
        >
          <CallEndIcon />
        </IconButton>
      </DialogActions>
      
      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default CallDialog;
