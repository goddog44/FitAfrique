import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Timer, Repeat, Dumbbell, Star, Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { UserProfile, DayPlan, Exercise } from '../../types';
import { generateDayPlan } from '../../utils/programGenerator';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Props {
  profile: UserProfile;
}

function ExerciseCard({
  exercise,
  index,
  completed,
  onToggle,
}: {
  exercise: Exercise;
  index: number;
  completed: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const TIPS: Record<string, string> = {
    'Pectoraux': 'Gardez les coudes à 45° et contractez les pectoraux en montant.',
    'Triceps': 'Gardez les coudes fixes, ne les écartez pas.',
    'Dos / Biceps': 'Initiez le mouvement avec les épaules, pas les bras.',
    'Cuisses / Fessiers': 'Descendez jusqu\'à ce que les cuisses soient parallèles au sol.',
    'Épaules': 'Évitez de hausser les épaules, gardez la nuque allongée.',
    'Biceps': 'Serrez fort le biceps en haut du mouvement.',
    'Abdominaux / Core': 'Respirez normalement, ne bloquez pas votre souffle.',
  };

  const tip = TIPS[exercise.muscleGroup];

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        completed
          ? 'bg-emerald-500/10 border-emerald-500/40'
          : 'bg-slate-800/60 border-slate-700/50'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
              completed ? 'bg-emerald-500/30 text-emerald-400' : 'bg-slate-700 text-slate-400'
            }`}
          >
            {completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={`font-semibold text-sm leading-tight ${
                  completed ? 'text-emerald-300 line-through opacity-70' : 'text-white'
                }`}
              >
                {exercise.name}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button onClick={onToggle}>
                  {completed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-slate-400 text-xs mt-0.5">{exercise.muscleGroup}</p>

            <div className="flex flex-wrap gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-xs">
                <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">
                  <span className="text-white font-medium">{exercise.sets}</span> séries ×{' '}
                  <span className="text-white font-medium">{exercise.reps}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Timer className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-300">
                  Repos : <span className="text-white font-medium">{exercise.restSeconds}s</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {expanded && tip && (
          <div className="mt-3 flex items-start gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-slate-400 text-xs">{tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkoutPlan({ profile }: Props) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const p = generateDayPlan(profile);
    setPlan(p);
    loadLogs(p);
  }, [profile]);

  const loadLogs = async (p: DayPlan) => {
    if (!user) return;
    const { data } = await supabase
      .from('workout_logs')
      .select('exercise_name, completed')
      .eq('user_id', user.id)
      .eq('logged_date', todayStr);

    if (data) {
      const done = new Set(data.filter((l) => l.completed).map((l) => l.exercise_name));
      setCompleted(done);
    }
  };

  const toggleExercise = async (exerciseName: string) => {
    if (!user) return;
    const isNowDone = !completed.has(exerciseName);

    setCompleted((prev) => {
      const next = new Set(prev);
      if (isNowDone) next.add(exerciseName);
      else next.delete(exerciseName);
      return next;
    });

    const { data: existing } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('logged_date', todayStr)
      .eq('exercise_name', exerciseName)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('workout_logs')
        .update({ completed: isNowDone })
        .eq('id', existing.id);
    } else {
      await supabase.from('workout_logs').insert({
        user_id: user.id,
        logged_date: todayStr,
        exercise_name: exerciseName,
        sets_completed: plan?.workout.exercises.find((e) => e.name === exerciseName)?.sets ?? 0,
        reps_completed: 0,
        completed: isNowDone,
      });
    }

    // Update daily checkin
    if (plan && !plan.workout.isRestDay) {
      const allDone = plan.workout.exercises.every(
        (e) => e.name === exerciseName ? isNowDone : completed.has(e.name)
      );
      await supabase
        .from('daily_checkins')
        .upsert(
          { user_id: user.id, checkin_date: todayStr, workout_completed: allDone },
          { onConflict: 'user_id,checkin_date', ignoreDuplicates: false }
        );
    }
  };

  if (!plan) return null;

  const workout = plan.workout;
  const progress = workout.isRestDay
    ? 100
    : Math.round((completed.size / Math.max(1, workout.exercises.length)) * 100);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Semaine {plan.weekNumber}
          </span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-400">
            {profile.level === 'beginner' ? 'Débutant' : 'Intermédiaire'}
          </span>
        </div>
        <h1 className="text-xl font-bold text-white">{workout.title}</h1>
      </div>

      {/* Rest day */}
      {workout.isRestDay && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Jour de récupération</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Profite de ce repos mérité. La récupération permet à tes muscles de se reconstruire et de grandir.
            Mange bien, hydrate-toi, et dors suffisamment.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Eau', value: '2-3L', color: 'text-blue-400' },
              { label: 'Sommeil', value: '8h', color: 'text-amber-400' },
              { label: 'Protéines', value: `${Math.round(profile.weight * 1.8)}g`, color: 'text-emerald-400' },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-900/50 rounded-xl p-3">
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-slate-400 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workout progress */}
      {!workout.isRestDay && (
        <>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-300">Progression</span>
              </div>
              <span className="text-sm font-bold text-white">{completed.size}/{workout.exercises.length}</span>
            </div>
            <div className="bg-slate-900/50 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-slate-500 text-xs">{workout.durationMin} min estimées</p>
              <p className="text-slate-400 text-xs">{progress}% complété</p>
            </div>
          </div>

          {/* Exercise cards */}
          <div className="space-y-3">
            {workout.exercises.map((ex, i) => (
              <ExerciseCard
                key={ex.name}
                exercise={ex}
                index={i}
                completed={completed.has(ex.name)}
                onToggle={() => toggleExercise(ex.name)}
              />
            ))}
          </div>

          {progress === 100 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-emerald-300 font-bold text-lg">Félicitations !</h3>
              <p className="text-slate-400 text-sm mt-1">
                Séance complète ! N'oublie pas ta collation post-entraînement.
              </p>
            </div>
          )}
        </>
      )}

      {/* Tip of the day */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <p className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1">Conseil du jour</p>
        <p className="text-slate-300 text-sm">
          {workout.isRestDay
            ? 'La récupération active (marche légère, étirements) améliore la circulation et accélère la récupération musculaire.'
            : 'Concentre-toi sur la technique plutôt que la vitesse. Un mouvement contrôlé active mieux le muscle cible.'}
        </p>
      </div>
    </div>
  );
}
