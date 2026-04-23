import { useEffect, useState } from 'react';
import type { UserProfile, DayPlan, ScheduleItem } from '../../types';
import { generateDayPlan } from '../../utils/programGenerator';

interface Props {
  profile: UserProfile;
}

const CATEGORY_STYLES: Record<string, { bg: string; dot: string; label: string }> = {
  meal: { bg: 'bg-emerald-500/15 border-emerald-500/30', dot: 'bg-emerald-400', label: 'Repas' },
  workout: { bg: 'bg-amber-500/15 border-amber-500/30', dot: 'bg-amber-400', label: 'Entraînement' },
  water: { bg: 'bg-blue-500/15 border-blue-500/30', dot: 'bg-blue-400', label: 'Hydratation' },
  rest: { bg: 'bg-slate-700/40 border-slate-600/30', dot: 'bg-slate-400', label: 'Repos' },
  sleep: { bg: 'bg-teal-500/15 border-teal-500/30', dot: 'bg-teal-400', label: 'Sommeil' },
};

function isCurrentOrPast(time: string): { state: 'past' | 'current' | 'future' } {
  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  const itemMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (nowMinutes > itemMinutes + 60) return { state: 'past' };
  if (nowMinutes >= itemMinutes - 5 && nowMinutes <= itemMinutes + 60) return { state: 'current' };
  return { state: 'future' };
}

function ScheduleRow({ item, isLast }: { item: ScheduleItem; isLast: boolean }) {
  const style = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.rest;
  const { state } = isCurrentOrPast(item.time);

  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ring-2 transition-all ${
            state === 'current'
              ? 'ring-emerald-400 bg-emerald-400 scale-125'
              : state === 'past'
              ? 'ring-slate-600 bg-slate-600'
              : `ring-slate-700 ${style.dot}`
          }`}
        />
        {!isLast && (
          <div className={`w-px flex-1 mt-1 ${state === 'past' ? 'bg-slate-700' : 'bg-slate-800'}`} style={{ minHeight: '2rem' }} />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 mb-4 -mt-0.5`}>
        <div className="flex items-start gap-3">
          <span className={`text-xs font-mono font-medium mt-0.5 flex-shrink-0 w-12 ${
            state === 'current' ? 'text-emerald-400' : state === 'past' ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {item.time}
          </span>
          <div
            className={`flex-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 border transition-all ${
              state === 'current'
                ? 'bg-emerald-500/15 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                : state === 'past'
                ? 'bg-slate-800/30 border-slate-700/20 opacity-50'
                : `${style.bg}`
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                state === 'current' ? 'text-emerald-200' : state === 'past' ? 'text-slate-500' : 'text-slate-200'
              }`}>
                {item.activity}
              </p>
              <p className={`text-xs mt-0.5 ${
                state === 'current' ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {style.label}{state === 'current' ? ' · Maintenant' : ''}
              </p>
            </div>
            {state === 'current' && (
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DailySchedule({ profile }: Props) {
  const [plan, setPlan] = useState<DayPlan | null>(null);

  useEffect(() => {
    setPlan(generateDayPlan(profile));
  }, [profile]);

  if (!plan) return null;

  const { schedule, workout } = plan;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Planning du Jour</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Il est <span className="text-white font-medium">{timeStr}</span>
          {workout.isRestDay ? ' · Jour de repos' : ` · ${workout.title}`}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORY_STYLES).map(([key, val]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${val.dot}`} />
            {val.label}
          </span>
        ))}
      </div>

      {/* Timeline */}
      <div className="pt-2">
        {schedule.map((item, i) => (
          <ScheduleRow key={`${item.time}-${item.activity}`} item={item} isLast={i === schedule.length - 1} />
        ))}
      </div>

      {/* Summary card */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Résumé de la journée</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-lg font-bold text-white">
              {schedule.filter((s) => s.category === 'meal').length}
            </p>
            <p className="text-slate-400 text-xs">Repas planifiés</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-lg font-bold text-white">
              {schedule.filter((s) => s.category === 'water').length}
            </p>
            <p className="text-slate-400 text-xs">Rappels hydratation</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-lg font-bold text-white">
              {workout.isRestDay ? '0' : `~${workout.durationMin} min`}
            </p>
            <p className="text-slate-400 text-xs">Durée entraînement</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-3">
            <p className="text-lg font-bold text-white">8h</p>
            <p className="text-slate-400 text-xs">Sommeil cible</p>
          </div>
        </div>
      </div>
    </div>
  );
}
