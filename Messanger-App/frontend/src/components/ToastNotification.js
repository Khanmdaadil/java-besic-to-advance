import React from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * Toast notification component that shows temporary messages to the user
 */
const ToastNotification = ({ open, message, severity, onClose, autoHideDuration = 6000 }) => {
  return (
    <Snackbar 
      open={open} 
      autoHideDuration={autoHideDuration} 
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        elevation={6} 
        variant="filled" 
        onClose={onClose} 
        severity={severity || 'info'} 
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default ToastNotification;
