import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import ProfileSetup from './components/Setup/ProfileSetup';
import Navbar from './components/Layout/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import WorkoutPlan from './components/Workout/WorkoutPlan';
import NutritionPlan from './components/Nutrition/NutritionPlan';
import DailySchedule from './components/Schedule/DailySchedule';
import ProgressTracker from './components/Progress/ProgressTracker';
import { supabase } from './lib/supabase';
import type { UserProfile } from './types';
import { Loader } from 'lucide-react';

type Tab = 'dashboard' | 'workout' | 'nutrition' | 'schedule' | 'progress';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfileLoading(false);
      setProfile(null);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setProfile(data);
    setProfileLoading(false);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
            <Loader className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-slate-400 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!profile) {
    return <ProfileSetup onComplete={loadProfile} />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      <main className="md:ml-20 min-h-screen pb-24 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {activeTab === 'dashboard' && (
            <Dashboard
              profile={profile}
              onTabChange={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'workout' && <WorkoutPlan profile={profile} />}
          {activeTab === 'nutrition' && <NutritionPlan profile={profile} />}
          {activeTab === 'schedule' && <DailySchedule profile={profile} />}
          {activeTab === 'progress' && <ProgressTracker profile={profile} />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
