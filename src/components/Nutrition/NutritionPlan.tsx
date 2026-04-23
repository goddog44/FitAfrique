import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Flame, Zap, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { UserProfile, DayPlan, Meal } from '../../types';
import { generateDayPlan } from '../../utils/programGenerator';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Props {
  profile: UserProfile;
}

function MealCard({
  meal,
  completed,
  onToggle,
}: {
  meal: Meal;
  completed: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const MEAL_COLORS: Record<string, { bg: string; border: string; accent: string; dot: string }> = {
    breakfast: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', accent: 'text-amber-400', dot: 'bg-amber-400' },
    lunch: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', accent: 'text-emerald-400', dot: 'bg-emerald-400' },
    snack: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', accent: 'text-teal-400', dot: 'bg-teal-400' },
    dinner: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', accent: 'text-blue-400', dot: 'bg-blue-400' },
  };

  const col = MEAL_COLORS[meal.type] ?? MEAL_COLORS.breakfast;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        completed
          ? 'bg-emerald-500/10 border-emerald-500/30 opacity-80'
          : `${col.bg} ${col.border}`
      }`}
    >
      {/* Header */}
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${completed ? 'bg-emerald-400' : col.dot}`} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-sm ${completed ? 'text-emerald-300' : 'text-white'}`}>
                  {meal.label}
                </h3>
                <span className={`text-xs ${completed ? 'text-emerald-400/70' : col.accent}`}>
                  {meal.time}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Flame className="w-3 h-3 text-orange-400" />
                  {meal.totalCalories} kcal
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Zap className="w-3 h-3 text-blue-400" />
                  {meal.totalProtein}g protéines
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </div>
        </div>
      </button>

      {/* Food items */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-slate-700/30 pt-3">
          {meal.items.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${col.dot}`} />
                <div className="min-w-0">
                  <p className="text-slate-200 text-sm">{item.name}</p>
                  <p className="text-slate-500 text-xs">{item.quantity}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-slate-300 text-xs font-medium">{item.calories} kcal</p>
                <p className="text-slate-500 text-xs">{item.protein}g prot.</p>
              </div>
            </div>
          ))}

          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`w-full mt-3 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
              completed
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            {completed ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Repas pris
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                Marquer comme pris
              </>
            )}
          </button>
        </div>
      )}

      {/* Compact toggle when collapsed */}
      {!expanded && (
        <div className="px-4 pb-3">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              completed ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {completed ? (
              <><CheckCircle className="w-3.5 h-3.5" />Pris</>
            ) : (
              <><Circle className="w-3.5 h-3.5" />Marquer comme pris</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function NutritionPlan({ profile }: Props) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setPlan(generateDayPlan(profile));
    loadLogs();
  }, [profile]);

  const loadLogs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('meal_logs')
      .select('meal_type, completed')
      .eq('user_id', user.id)
      .eq('logged_date', todayStr);

    if (data) {
      setCompletedMeals(new Set(data.filter((l) => l.completed).map((l) => l.meal_type)));
    }
  };

  const toggleMeal = async (mealType: string) => {
    if (!user) return;
    const isNowDone = !completedMeals.has(mealType);

    setCompletedMeals((prev) => {
      const next = new Set(prev);
      if (isNowDone) next.add(mealType);
      else next.delete(mealType);
      return next;
    });

    const { data: existing } = await supabase
      .from('meal_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('logged_date', todayStr)
      .eq('meal_type', mealType)
      .maybeSingle();

    if (existing) {
      await supabase.from('meal_logs').update({ completed: isNowDone }).eq('id', existing.id);
    } else {
      await supabase.from('meal_logs').insert({
        user_id: user.id,
        logged_date: todayStr,
        meal_type: mealType,
        completed: isNowDone,
      });
    }

    // Update daily checkin
    const newCount = isNowDone
      ? completedMeals.size + 1
      : Math.max(0, completedMeals.size - 1);

    await supabase
      .from('daily_checkins')
      .upsert(
        { user_id: user.id, checkin_date: todayStr, meals_completed: newCount },
        { onConflict: 'user_id,checkin_date', ignoreDuplicates: false }
      );
  };

  if (!plan) return null;

  const { targetCalories, targetProtein, meals } = plan.nutrition;
  const consumedCal = meals
    .filter((m) => completedMeals.has(m.type))
    .reduce((s, m) => s + m.totalCalories, 0);
  const consumedProt = meals
    .filter((m) => completedMeals.has(m.type))
    .reduce((s, m) => s + m.totalProtein, 0);

  const calPct = Math.min(100, Math.round((consumedCal / targetCalories) * 100));
  const protPct = Math.min(100, Math.round((consumedProt / targetProtein) * 100));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
            Semaine {plan.weekNumber}
          </span>
        </div>
        <h1 className="text-xl font-bold text-white">Plan Nutritionnel</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {plan.workout.isRestDay ? 'Jour de repos' : 'Jour d\'entraînement'} · Aliments locaux
        </p>
      </div>

      {/* Daily targets */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">Objectif journalier</h2>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-slate-300">Calories</span>
            </div>
            <span className="text-white font-medium">{consumedCal} / {targetCalories} kcal</span>
          </div>
          <div className="bg-slate-900/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${calPct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300">Protéines</span>
            </div>
            <span className="text-white font-medium">{consumedProt} / {targetProtein}g</span>
          </div>
          <div className="bg-slate-900/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-teal-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${protPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{completedMeals.size} repas pris sur {meals.length}</span>
        </div>
      </div>

      {/* Meal cards */}
      <div className="space-y-3">
        {meals.map((meal) => (
          <MealCard
            key={meal.type}
            meal={meal}
            completed={completedMeals.has(meal.type)}
            onToggle={() => toggleMeal(meal.type)}
          />
        ))}
      </div>

      {/* Tips */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">Rappel important</p>
        <p className="text-slate-300 text-sm">
          Bois <span className="text-white font-medium">2 à 3 litres d'eau</span> par jour.
          La <span className="text-white font-medium">bouillie enrichie</span> (maïs + soja + arachide + avoine)
          est ta base protéinée du matin — prépare-la la veille pour gagner du temps.
        </p>
      </div>
    </div>
  );
}
