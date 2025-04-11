import React from 'react';
import { Container, Grid, Typography, Box } from '@mui/material';
import { useGamification } from '../context/GamificationContext';
import BadgeDisplay from '../components/BadgeDisplay';
import StreakDisplay from '../components/StreakDisplay';
import AchievementsList from '../components/AchievementsList';

const Achievements = () => {
  const { 
    badges, 
    weeklyStreak, 
    bestStreak, 
    streakHistory,
    level,
    experience,
    experienceForNextLevel
  } = useGamification();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 4 }}>
        🏆 Your Achievements
      </Typography>
      
      <Grid container spacing={3}>
        {/* Streak Information */}
        <Grid item xs={12} md={4}>
          <StreakDisplay 
            currentStreak={weeklyStreak} 
            bestStreak={bestStreak}
            streakHistory={streakHistory}
          />
        </Grid>

        {/* Level Progress */}
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="h6" gutterBottom>
              Level {level}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {experience} / {experienceForNextLevel()} XP
            </Typography>
            {/* Add progress bar here if needed */}
          </Box>
        </Grid>

        {/* Badges Grid */}
        <Grid item xs={12}>
          <BadgeDisplay badges={badges} />
        </Grid>

        {/* Achievements List */}
        <Grid item xs={12}>
          <AchievementsList badges={badges} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Achievements; 