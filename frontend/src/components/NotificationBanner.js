import React from 'react';
import { Box, Snackbar, Alert, Typography, Paper } from '@mui/material';
import { useGamification } from '../context/GamificationContext';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';

const NotificationBanner = () => {
  const { 
    showLevelUpNotification, 
    showBadgeNotification, 
    newBadge,
    level
  } = useGamification();

  return (
    <>
      {/* Level Up Notification */}
      <Snackbar
        open={showLevelUpNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert 
          icon={<StarIcon />} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Level Up! 🎉
          </Typography>
          <Typography variant="body2">
            Congratulations! You've reached level {level}
          </Typography>
        </Alert>
      </Snackbar>

      {/* Badge Notification */}
      <Snackbar
        open={showBadgeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert 
          icon={<EmojiEventsIcon />} 
          severity="info" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            New Badge Earned! 🏅
          </Typography>
          {newBadge && (
            <Typography variant="body2">
              {newBadge.name} - {newBadge.description}
            </Typography>
          )}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationBanner; 