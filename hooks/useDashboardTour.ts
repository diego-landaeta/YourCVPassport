import { useState, useEffect } from 'react';

const TOUR_COMPLETED_KEY = 'dashboardTourCompleted';

export const useDashboardTour = (userId?: string) => {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tourJustCompleted, setTourJustCompleted] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Check if user has completed the tour
    const tourCompleted = localStorage.getItem(`${TOUR_COMPLETED_KEY}_${userId}`);

    // Show tour only if not completed
    if (!tourCompleted) {
      // Small delay to ensure dashboard is fully rendered
      setTimeout(() => {
        setShowTour(true);
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const completeTour = () => {
    if (userId) {
      localStorage.setItem(`${TOUR_COMPLETED_KEY}_${userId}`, 'true');
    }
    setShowTour(false);
    setTourJustCompleted(true);
  };

  const skipTour = () => {
    if (userId) {
      localStorage.setItem(`${TOUR_COMPLETED_KEY}_${userId}`, 'true');
    }
    setShowTour(false);
    setTourJustCompleted(true);
  };

  const resetTour = () => {
    if (userId) {
      localStorage.removeItem(`${TOUR_COMPLETED_KEY}_${userId}`);
    }
    setShowTour(true);
    setTourJustCompleted(false);
  };

  const hasTourBeenCompleted = (userId?: string) => {
    if (!userId) return false;
    return localStorage.getItem(`${TOUR_COMPLETED_KEY}_${userId}`) === 'true';
  };

  return {
    showTour,
    isLoading,
    tourJustCompleted,
    completeTour,
    skipTour,
    resetTour,
    hasTourBeenCompleted: hasTourBeenCompleted(userId),
  };
};
