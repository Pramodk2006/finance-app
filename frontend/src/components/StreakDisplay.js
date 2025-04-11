import React from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { useGamification } from '../context/GamificationContext';

const StreakProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[300],
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    backgroundImage: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`,
  },
}));

const StreakDisplay = () => {
  const { streak } = useGamification();
  
  // Calculate streak progress (assuming 30 days is max streak)
  const maxStreak = 30;
  const streakProgress = Math.min((streak / maxStreak) * 100, 100);
  
  // Get streak message based on current streak
  const getStreakMessage = () => {
    if (streak === 0) return "Start your streak today!";
    if (streak < 3) return "Keep it up! You're just getting started.";
    if (streak < 7) return "Nice streak! You're building good habits.";
    if (streak < 14) return "Impressive! You're on fire!";
    if (streak < 30) return "Amazing! You're a financial discipline master!";
    return "Legendary! You've maintained perfect discipline for a month!";
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        background: (theme) => 
          `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LocalFireDepartmentIcon 
          color="error" 
          sx={{ 
            fontSize: 28, 
            mr: 1,
            animation: streak > 0 ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(1)',
              },
              '50%': {
                transform: 'scale(1.2)',
              },
              '100%': {
                transform: 'scale(1)',
              },
            },
          }} 
        />
        <Typography variant="h5" component="h2" fontWeight="bold">
          Your Streak
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h3" color="error.main" fontWeight="bold">
          {streak}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {streak === 1 ? 'day' : 'days'} in a row
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {streak}/{maxStreak} days
          </Typography>
        </Box>
        <StreakProgress variant="determinate" value={streakProgress} />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        {getStreakMessage()}
      </Typography>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Tip:</strong> Log in daily and track your expenses to maintain your streak!
        </Typography>
      </Box>
    </Paper>
  );
};

export default StreakDisplay; 