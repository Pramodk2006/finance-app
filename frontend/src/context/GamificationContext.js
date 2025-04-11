import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const GamificationContext = createContext();

export const useGamification = () => useContext(GamificationContext);

export const GamificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [lastBudgetCheck, setLastBudgetCheck] = useState(null);
  const [lastSavingsCheck, setLastSavingsCheck] = useState(null);
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);
  const [newBadge, setNewBadge] = useState(null);
  const [showLevelUpNotification, setShowLevelUpNotification] = useState(false);
  const [streakHistory, setStreakHistory] = useState([]);

  // Load user's gamification data from localStorage
  useEffect(() => {
    if (user) {
      const savedData = localStorage.getItem(`gamification_${user.id}`);
      if (savedData) {
        const { 
          badges, 
          level, 
          experience, 
          lastBudgetCheck, 
          lastSavingsCheck,
          weeklyStreak,
          bestStreak,
          streakHistory 
        } = JSON.parse(savedData);
        setBadges(badges || []);
        setLevel(level || 1);
        setExperience(experience || 0);
        setLastBudgetCheck(lastBudgetCheck || null);
        setLastSavingsCheck(lastSavingsCheck || null);
        setWeeklyStreak(weeklyStreak || 0);
        setBestStreak(bestStreak || 0);
        setStreakHistory(streakHistory || []);
      }
    }
  }, [user]);

  // Save gamification data to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(
        `gamification_${user.id}`,
        JSON.stringify({ 
          badges, 
          level, 
          experience,
          lastBudgetCheck,
          lastSavingsCheck,
          weeklyStreak,
          bestStreak,
          streakHistory
        })
      );
    }
  }, [user, badges, level, experience, lastBudgetCheck, lastSavingsCheck, weeklyStreak, bestStreak, streakHistory]);

  // Calculate experience needed for next level
  const experienceForNextLevel = () => {
    // Make level progression more gradual with a steeper curve
    return Math.floor(100 * Math.pow(1.5, level - 1));
  };

  // Add experience and check for level up
  const addExperience = (amount, reason) => {
    // Cap experience awards to prevent rapid leveling
    const cappedAmount = Math.min(amount, 50);
    const newExperience = experience + cappedAmount;
    setExperience(newExperience);
    
    const requiredExperience = experienceForNextLevel();
    if (newExperience >= requiredExperience) {
      setLevel(prevLevel => prevLevel + 1);
      setExperience(newExperience - requiredExperience);
      setShowLevelUpNotification(true);
      
      setTimeout(() => {
        setShowLevelUpNotification(false);
      }, 5000);
    }
  };

  // Update streak based on budget and savings achievements
  const updateFinanceStreak = (budgetMet, savingsDeposited) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // Get the start of the current week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    // Check if we already processed this week
    const lastBudgetDate = lastBudgetCheck ? new Date(lastBudgetCheck) : null;
    const lastSavingsDate = lastSavingsCheck ? new Date(lastSavingsCheck) : null;
    
    // A new week starts if either check hasn't been done yet this week
    const isNewBudgetWeek = !lastBudgetDate || lastBudgetDate < startOfWeek;
    const isNewSavingsWeek = !lastSavingsDate || lastSavingsDate < startOfWeek;
    const isNewWeek = isNewBudgetWeek || isNewSavingsWeek;

    if (isNewWeek) {
      // Update the respective check dates only if the condition is met
      if (budgetMet) {
        setLastBudgetCheck(today.toISOString());
      }
      if (savingsDeposited) {
        setLastSavingsCheck(today.toISOString());
      }

      // Both conditions must be met in the same week to maintain/increment streak
      if (budgetMet && savingsDeposited) {
        const newStreak = weeklyStreak + 1;
        setWeeklyStreak(newStreak);
        
        // Update best streak if current streak is higher
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
          if (newStreak >= 5) {
            awardBadge(
              "streak_master",
              "Streak Master",
              "Achieved a 5-week streak of meeting budget and savings goals"
            );
            addExperience(200, "New best streak achievement");
          }
        }

        // Add to streak history
        setStreakHistory(prev => [...prev, {
          date: today.toISOString(),
          streak: newStreak,
          budgetMet: true,
          savingsDeposited: true
        }]);

        addExperience(20, "Weekly budget and savings goals met");

        // Check for Finance Hero badge (3 weeks streak)
        if (weeklyStreak === 2) { // Will become 3 after increment
          awardBadge(
            "finance_hero",
            "Finance Hero",
            "Maintained budget and savings goals for 3 consecutive weeks"
          );
          addExperience(100, "Earned Finance Hero badge");
        }
      } else {
        // Record the streak break in history
        setStreakHistory(prev => [...prev, {
          date: today.toISOString(),
          streak: 0,
          budgetMet,
          savingsDeposited
        }]);
        
        // Reset streak if either condition is not met for the week
        setWeeklyStreak(0);
      }
    }
  };

  // Award a new badge
  const awardBadge = (badgeId, badgeName, description) => {
    if (!badges.some(b => b.id === badgeId)) {
      const newBadgeObj = {
        id: badgeId,
        name: badgeName,
        description: description,
        dateEarned: new Date().toISOString()
      };
      
      setBadges(prev => [...prev, newBadgeObj]);
      setNewBadge(newBadgeObj);
      setShowBadgeNotification(true);
      
      setTimeout(() => {
        setShowBadgeNotification(false);
        setNewBadge(null);
      }, 5000);
    }
  };

  return (
    <GamificationContext.Provider
      value={{
        badges,
        weeklyStreak,
        bestStreak,
        streakHistory,
        level,
        experience,
        experienceForNextLevel,
        addExperience,
        awardBadge,
        updateFinanceStreak,
        showBadgeNotification,
        newBadge,
        showLevelUpNotification
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}; 