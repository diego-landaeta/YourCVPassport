import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export const useDashboardTour = (userId?: string, profileCompleteness?: number, dashboardTourCompleted?: boolean | null, wizardCompleted?: boolean) => {
  const { refetchProfile } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tourJustCompleted, setTourJustCompleted] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Show tour ONLY if:
    // 1. User hasn't completed/skipped tour before (checked from database)
    // 2. User has completed the profile wizard (wizard_completed = true)
    // The tour shows users how to use the dashboard features after completing their profile setup
    if (!dashboardTourCompleted && wizardCompleted) {
      // Small delay to ensure dashboard is fully rendered
      setTimeout(() => {
        setShowTour(true);
        setIsLoading(false);
      }, 800);
    } else {
      setIsLoading(false);
    }
  }, [userId, wizardCompleted, dashboardTourCompleted]);

  const completeTour = async () => {
    if (userId) {
      // Guardar en base de datos
      await supabase
        .from('profiles')
        .update({ dashboard_tour_completed: true })
        .eq('id', userId);

      // ✅ Refetch profile to update dashboard_tour_completed status in context
      await refetchProfile();
    }
    setShowTour(false);
    setTourJustCompleted(true);
  };

  const skipTour = async () => {
    if (userId) {
      // Guardar en base de datos
      await supabase
        .from('profiles')
        .update({ dashboard_tour_completed: true })
        .eq('id', userId);

      // ✅ Refetch profile to update dashboard_tour_completed status in context
      await refetchProfile();
    }
    setShowTour(false);
    setTourJustCompleted(true);
  };

  const resetTour = async () => {
    if (userId) {
      // Resetear en base de datos
      await supabase
        .from('profiles')
        .update({ dashboard_tour_completed: false })
        .eq('id', userId);
    }
    setShowTour(true);
    setTourJustCompleted(false);
  };

  const hasTourBeenCompleted = (tourCompleted?: boolean | null) => {
    return tourCompleted === true;
  };

  return {
    showTour,
    isLoading,
    tourJustCompleted,
    completeTour,
    skipTour,
    resetTour,
    hasTourBeenCompleted: hasTourBeenCompleted(dashboardTourCompleted),
  };
};
