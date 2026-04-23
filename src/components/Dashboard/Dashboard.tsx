import { useEffect, useState } from 'react';
import { Flame, Dumbbell, Apple, Clock, TrendingUp, CheckCircle, Circle, Bell, ChevronRight, Star } from 'lucide-react';
import type { UserProfile, DayPlan, DailyCheckin } from '../../types';
import { generateDayPlan } from '../../utils/programGenerator';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Props {
  profile: UserProfile;
  onTabChange: (tab: 'workout' | 'nutrition' | 'schedule' | 'progress') => void;
}

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_NAMES = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

export default function Dashboard({ profile, onTabChange }: Props) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    setPlan(generateDayPlan(profile));
    loadCheckin();
    checkNotifPermission();
  }, [profile]);

  const loadCheckin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('checkin_date', todayStr)
      .maybeSingle();
    setCheckin(data);
  };

  const checkNotifPermission = () => {
    if ('Notification' in window) {
      setNotifEnabled(Notification.permission === 'granted');
    }
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifEnabled(perm === 'granted');
    if (perm === 'granted') {
      new Notification('FitAfrique activé !', {
        body: "Tu recevras des rappels pour tes repas et séances.",
        icon: '/vite.svg',
      });
      scheduleReminders();
    }
  };

  const scheduleReminders = () => {
    const now = new Date();
    const reminders = [
      { hour: 7, min: 0, msg: 'Petit-déjeuner ! Commence ta journée avec énergie.' },
      { hour: 9, min: 0, msg: plan?.workout.isRestDay ? 'Jour de repos - hydrate-toi bien.' : `Séance : ${plan?.workout.title}` },
      { hour: 13, min: 0, msg: 'Déjeuner - rappelle-toi de tes apports protéinés !' },
      { hour: 16, min: 30, msg: 'Collation post-entraînement !' },
      { hour: 19, min: 30, msg: 'Dîner - dernière chance pour les protéines.' },
    ];

    reminders.forEach(({ hour, min, msg }) => {
      const t = new Date();
      t.setHours(hour, min, 0, 0);
      const delay = t.getTime() - now.getTime();
      if (delay > 0) {
        setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification('FitAfrique', { body: msg, icon: '/vite.svg' });
          }
        }, delay);
      }
    });
  };

  const toggleWorkoutDone = async () => {
    if (!user || !plan) return;
    const newVal = !checkin?.workout_completed;
    if (checkin) {
      const { data } = await supabase
        .from('daily_checkins')
        .update({ workout_completed: newVal })
        .eq('id', checkin.id)
        .select()
        .single();
      setCheckin(data);
    } else {
      const { data } = await supabase
        .from('daily_checkins')
        .insert({ user_id: user.id, checkin_date: todayStr, workout_completed: newVal, meals_completed: 0 })
        .select()
        .single();
      setCheckin(data);
    }
  };

  if (!plan) return null;

  const totalMeals = plan.nutrition.meals.length;
  const mealsProgress = checkin?.meals_completed ?? 0;
  const workoutDone = checkin?.workout_completed ?? false;

  const totalCal = plan.nutrition.meals.reduce((s, m) => s + m.totalCalories, 0);
  const totalProt = plan.nutrition.meals.reduce((s, m) => s + m.totalProtein, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">
            {DAY_NAMES[today.getDay()]}, {today.getDate()} {MONTH_NAMES[today.getMonth()]}
          </p>
          <h1 className="text-2xl font-bold text-white mt-0.5">
            Salut, <span className="text-emerald-400">{profile.name}</span> !
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Semaine <span className="text-white font-medium">{plan.weekNumber}</span> · Jour{' '}
            <span className="text-white font-medium">{plan.dayNumber}</span>
          </p>
        </div>

        {!notifEnabled && (
          <button
            onClick={requestNotifications}
            className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3 py-2 rounded-xl hover:bg-amber-500/20 transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            Activer rappels
          </button>
        )}
      </div>

      {/* Today's status card */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 ${
          plan.workout.isRestDay
            ? 'bg-slate-800/60 border border-slate-700/50'
            : 'bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30'
        }`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                plan.workout.isRestDay ? 'bg-slate-700' : 'bg-emerald-500/30'
              }`}
            >
              {plan.workout.isRestDay ? (
                <Star className="w-6 h-6 text-slate-400" />
              ) : (
                <Dumbbell className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-white font-bold text-base leading-tight">
                  {plan.workout.isRestDay ? 'Jour de Repos' : plan.workout.title}
                </h2>
                {!plan.workout.isRestDay && (
                  <button
                    onClick={toggleWorkoutDone}
                    className="flex-shrink-0 transition-transform active:scale-95"
                  >
                    {workoutDone ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-500" />
                    )}
                  </button>
                )}
              </div>
              {plan.workout.isRestDay ? (
                <p className="text-slate-400 text-sm mt-1">
                  Profite pour te reposer et bien manger. La récupération est aussi important que l'entraînement.
                </p>
              ) : (
                <p className="text-slate-300 text-sm mt-1">
                  {plan.workout.exercises.length} exercices · {plan.workout.durationMin} min
                  {workoutDone && <span className="ml-2 text-emerald-400 font-medium">Complété !</span>}
                </p>
              )}
            </div>
          </div>

          {!plan.workout.isRestDay && (
            <div className="mt-4 flex flex-wrap gap-2">
              {plan.workout.exercises.slice(0, 3).map((ex) => (
                <span
                  key={ex.name}
                  className="bg-slate-900/60 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700/50"
                >
                  {ex.name.split(' ').slice(0, 2).join(' ')}
                </span>
              ))}
              {plan.workout.exercises.length > 3 && (
                <span className="bg-slate-900/60 text-slate-400 text-xs px-3 py-1 rounded-full border border-slate-700/50">
                  +{plan.workout.exercises.length - 3} autres
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{totalCal}</div>
          <div className="text-slate-400 text-xs">kcal / jour</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{totalProt}g</div>
          <div className="text-slate-400 text-xs">Protéines</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
          <Apple className="w-5 h-5 text-teal-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{mealsProgress}/{totalMeals}</div>
          <div className="text-slate-400 text-xs">Repas</div>
        </div>
      </div>

      {/* Progression banner */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Niveau actuel</p>
            <p className="text-white font-semibold mt-0.5 capitalize">
              {profile.level === 'beginner' ? 'Débutant' : 'Intermédiaire'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Semaine</p>
            <p className="text-2xl font-bold text-emerald-400">{plan.weekNumber}</p>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, (plan.weekNumber / 12) * 100)}%` }}
          />
        </div>
        <p className="text-slate-500 text-xs mt-1.5">
          {Math.min(12, plan.weekNumber)} / 12 semaines
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {!plan.workout.isRestDay && (
          <button
            onClick={() => onTabChange('workout')}
            className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-white rounded-xl p-4 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5 text-emerald-400" />
              <span className="font-medium text-sm">Voir la séance</span>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
        <button
          onClick={() => onTabChange('nutrition')}
          className="flex items-center justify-between bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-white rounded-xl p-4 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Apple className="w-5 h-5 text-teal-400" />
            <span className="font-medium text-sm">Plan nutritionnel</span>
          </div>
          <ChevronRight className="w-4 h-4 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={() => onTabChange('schedule')}
          className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-white rounded-xl p-4 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-sm">Planning horaire</span>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={() => onTabChange('progress')}
          className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-white rounded-xl p-4 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span className="font-medium text-sm">Mes progrès</span>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
