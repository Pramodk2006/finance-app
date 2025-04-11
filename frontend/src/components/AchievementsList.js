import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LockIcon from '@mui/icons-material/Lock';
import { useGamification } from '../context/GamificationContext';

const AchievementCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[4],
  },
}));

const AchievementIcon = styled(Box)(({ theme }) => ({
  width: 50,
  height: 50,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
}));

const LockedIcon = styled(Box)(({ theme }) => ({
  width: 50,
  height: 50,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.grey[300],
  color: theme.palette.grey[600],
}));

const AchievementsList = () => {
  const { badges } = useGamification();
  
  // Define all available achievements
  const allAchievements = [
    {
      id: 'savings_1000',
      name: 'Savings Champion',
      description: 'Save ₹1,000 in a month',
      icon: '💰',
      category: 'Savings',
    },
    {
      id: 'savings_5000',
      name: 'Savings Master',
      description: 'Save ₹5,000 in a month',
      icon: '💰',
      category: 'Savings',
    },
    {
      id: 'budget_master',
      name: 'Budget Master',
      description: 'Stay under budget for a month',
      icon: '📊',
      category: 'Budgeting',
    },
    {
      id: 'transaction_streak',
      name: 'Consistent Tracker',
      description: 'Log transactions for 7 days in a row',
      icon: '📝',
      category: 'Consistency',
    },
    {
      id: 'transaction_streak_30',
      name: 'Dedication Award',
      description: 'Log transactions for 30 days in a row',
      icon: '📝',
      category: 'Consistency',
    },
    {
      id: 'first_transaction',
      name: 'Getting Started',
      description: 'Add your first transaction',
      icon: '🎯',
      category: 'First Steps',
    },
    {
      id: 'first_budget',
      name: 'Budget Planner',
      description: 'Create your first budget',
      icon: '📋',
      category: 'First Steps',
    },
    {
      id: 'ai_budget',
      name: 'AI Assistant',
      description: 'Use AI to create a budget',
      icon: '🤖',
      category: 'AI Features',
    },
  ];
  
  // Check if an achievement is earned
  const isEarned = (achievementId) => {
    return badges.some(badge => badge.id === achievementId);
  };
  
  // Group achievements by category
  const groupedAchievements = allAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {});
  
  // Calculate completion percentage
  const earnedCount = badges.length;
  const totalCount = allAchievements.length;
  const completionPercentage = (earnedCount / totalCount) * 100;

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
          Available Achievements
        </Typography>
      </Box>
      
      {/* Progress bar */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Completion
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {earnedCount}/{totalCount} achievements
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={completionPercentage} 
          sx={{ 
            height: 10, 
            borderRadius: 5,
            backgroundColor: 'grey.300',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              backgroundImage: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
            },
          }}
        />
      </Box>
      
      {/* Grouped achievements */}
      {Object.entries(groupedAchievements).map(([category, achievements]) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            {category}
          </Typography>
          
          <Grid container spacing={2}>
            {achievements.map((achievement) => {
              const earned = isEarned(achievement.id);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                  <AchievementCard 
                    elevation={earned ? 3 : 1}
                    sx={{ 
                      opacity: earned ? 1 : 0.7,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {earned ? (
                      <AchievementIcon>
                        {achievement.icon}
                      </AchievementIcon>
                    ) : (
                      <LockedIcon>
                        <LockIcon />
                      </LockedIcon>
                    )}
                    
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {achievement.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      {achievement.description}
                    </Typography>
                    
                    <Box sx={{ mt: 'auto' }}>
                      {earned ? (
                        <Chip 
                          label="Earned" 
                          color="success" 
                          size="small" 
                          sx={{ width: '100%' }}
                        />
                      ) : (
                        <Chip 
                          label="Locked" 
                          color="default" 
                          size="small" 
                          sx={{ width: '100%' }}
                        />
                      )}
                    </Box>
                  </AchievementCard>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Paper>
  );
};

export default AchievementsList; 