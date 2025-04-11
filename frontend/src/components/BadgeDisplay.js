import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tooltip,
  LinearProgress,
  Avatar,
  Zoom,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import { useGamification } from '../context/GamificationContext';

const BadgeAvatar = styled(Avatar)(({ theme }) => ({
  width: 60,
  height: 60,
  backgroundColor: theme.palette.primary.main,
  fontSize: '2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const LevelProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: theme.palette.grey[300],
  '& .MuiLinearProgress-bar': {
    borderRadius: 5,
    backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  },
}));

const BadgeDisplay = () => {
  const { 
    badges, 
    level, 
    experience, 
    experienceForNextLevel,
    showBadgeNotification,
    newBadge,
    showLevelUpNotification
  } = useGamification();

  const progress = (experience / experienceForNextLevel()) * 100;

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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <EmojiEventsIcon color="primary" sx={{ fontSize: 28, mr: 1 }} />
        <Typography variant="h5" component="h2" fontWeight="bold">
          Your Achievements
        </Typography>
      </Box>

      {/* Level and Progress */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <StarIcon color="secondary" sx={{ mr: 1 }} />
          <Typography variant="h6">Level {level}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LevelProgress variant="determinate" value={progress} sx={{ flexGrow: 1, mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {experience}/{experienceForNextLevel()} XP
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {experienceForNextLevel() - experience} XP to next level
        </Typography>
      </Box>

      {/* Badges Grid */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Your Badges ({badges.length})
      </Typography>
      
      <Grid container spacing={2}>
        {badges.length > 0 ? (
          badges.map((badge) => (
            <Grid item xs={6} sm={4} md={3} key={badge.id}>
              <Tooltip 
                title={
                  <Box>
                    <Typography variant="subtitle2">{badge.name}</Typography>
                    <Typography variant="body2">{badge.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Earned: {new Date(badge.dateEarned).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
                arrow
              >
                <Box sx={{ textAlign: 'center' }}>
                  <BadgeAvatar>
                    {badge.icon}
                  </BadgeAvatar>
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                    {badge.name}
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" color="text.secondary">
                You haven't earned any badges yet. Keep using the app to earn achievements!
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Badge Notification */}
      <Zoom in={showBadgeNotification}>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 2,
            boxShadow: 3,
            zIndex: 1000,
          }}
        >
          <BadgeAvatar sx={{ bgcolor: 'white', color: 'primary.main', mr: 2 }}>
            {newBadge?.icon}
          </BadgeAvatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              New Badge Earned!
            </Typography>
            <Typography variant="body2">
              {newBadge?.name}
            </Typography>
          </Box>
        </Paper>
      </Zoom>

      {/* Level Up Notification */}
      <Zoom in={showLevelUpNotification}>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'secondary.main',
            color: 'white',
            borderRadius: 2,
            boxShadow: 3,
            zIndex: 1000,
          }}
        >
          <StarIcon sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Level Up!
            </Typography>
            <Typography variant="body2">
              Congratulations! You've reached level {level}
            </Typography>
          </Box>
        </Paper>
      </Zoom>
    </Paper>
  );
};

export default BadgeDisplay; 