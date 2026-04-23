import { useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2, Scale, Dumbbell, Flame, Calendar, Loader } from 'lucide-react';
import type { UserProfile, WeightLog, DailyCheckin } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getDaysSinceStart } from '../../utils/programGenerator';

interface Props {
  profile: UserProfile;
}

const MONTH_NAMES = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function MiniChart({ logs }: { logs: WeightLog[] }) {
  if (logs.length < 2) return null;

  const weights = logs.map((l) => l.weight);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const range = max - min || 1;
  const width = 280;
  const height = 80;
  const padding = 12;

  const points = logs.map((log, i) => {
    const x = padding + (i / (logs.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((log.weight - min) / range) * (height - 2 * padding);
    return { x, y, weight: log.weight, date: log.logged_date };
  });

  const pathD = points.reduce(
    (acc, p, i) => acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`),
    ''
  );

  const areaD =
    pathD +
    ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: '80px' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" />
      ))}
    </svg>
  );
}

export default function ProgressTracker({ profile }: Props) {
  const { user } = useAuth();
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: wl }, { data: ci }] = await Promise.all([
      supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_date', { ascending: true })
        .limit(30),
      supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('checkin_date', { ascending: false })
        .limit(30),
    ]);
    setWeightLogs(wl ?? []);
    setCheckins(ci ?? []);
    setLoading(false);
  };

  const addWeight = async () => {
    if (!user || !newWeight) return;
    const w = parseFloat(newWeight);
    if (isNaN(w) || w < 20 || w > 300) return;

    setSaving(true);
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('weight_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('logged_date', todayStr)
      .maybeSingle();

    if (existing) {
      await supabase.from('weight_logs').update({ weight: w }).eq('id', existing.id);
    } else {
      await supabase.from('weight_logs').insert({
        user_id: user.id,
        weight: w,
        logged_date: todayStr,
      });
    }

    setNewWeight('');
    await loadData();
    setSaving(false);
  };

  const deleteWeightLog = async (id: string) => {
    await supabase.from('weight_logs').delete().eq('id', id);
    setWeightLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const daysSince = getDaysSinceStart(profile.start_date);
  const initialWeight = weightLogs[0]?.weight ?? profile.weight;
  const currentWeight = weightLogs[weightLogs.length - 1]?.weight ?? profile.weight;
  const gained = +(currentWeight - initialWeight).toFixed(1);

  const workoutDays = checkins.filter((c) => c.workout_completed).length;
  const totalMealsDone = checkins.reduce((s, c) => s + c.meals_completed, 0);

  const streak = (() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const ci = checkins.find((c) => c.checkin_date === ds);
      if (ci && (ci.workout_completed || ci.meals_completed > 0)) count++;
      else if (i > 0) break;
    }
    return count;
  })();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Mes Progrès</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Jour <span className="text-white font-medium">{daysSince + 1}</span> de ton programme
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <Scale className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">{currentWeight} kg</p>
          <p className="text-slate-400 text-xs">Poids actuel</p>
          {gained !== 0 && (
            <p className={`text-xs font-medium mt-1 ${gained > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {gained > 0 ? '+' : ''}{gained} kg depuis le début
            </p>
          )}
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <Flame className="w-5 h-5 text-orange-400 mb-2" />
          <p className="text-2xl font-bold text-white">{streak}</p>
          <p className="text-slate-400 text-xs">Jours consécutifs actifs</p>
          <p className="text-xs text-orange-400 mt-1">
            {streak >= 7 ? 'Série de feu !' : streak >= 3 ? 'Continue ainsi !' : 'En route !'}
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <Dumbbell className="w-5 h-5 text-teal-400 mb-2" />
          <p className="text-2xl font-bold text-white">{workoutDays}</p>
          <p className="text-slate-400 text-xs">Séances complètes</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <Calendar className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{daysSince + 1}</p>
          <p className="text-slate-400 text-xs">Jours de programme</p>
        </div>
      </div>

      {/* Weight chart */}
      {weightLogs.length >= 2 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Évolution du poids</span>
            </div>
            <span className="text-xs text-slate-500">{weightLogs.length} entrées</span>
          </div>
          <MiniChart logs={weightLogs} />
          <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
            <span>{formatDate(weightLogs[0].logged_date)}</span>
            <span>{formatDate(weightLogs[weightLogs.length - 1].logged_date)}</span>
          </div>
        </div>
      )}

      {/* Log weight */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Enregistrer mon poids</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Ex : 68.5"
              step="0.1"
              min="30"
              max="300"
              className="w-full bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg</span>
          </div>
          <button
            onClick={addWeight}
            disabled={saving || !newWeight}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 rounded-xl flex items-center gap-1.5 text-sm font-medium transition-all duration-200"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Ajouter
          </button>
        </div>
      </div>

      {/* Weight history */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      ) : weightLogs.length > 0 ? (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Historique du poids</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {[...weightLogs].reverse().map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0"
              >
                <div>
                  <p className="text-white text-sm font-medium">{log.weight} kg</p>
                  <p className="text-slate-500 text-xs">{formatDate(log.logged_date)}</p>
                </div>
                <button
                  onClick={() => deleteWeightLog(log.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 text-sm">
          Aucune entrée de poids pour l'instant
        </div>
      )}

      {/* Motivation */}
      <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-4">
        <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">Motivation</p>
        <p className="text-slate-200 text-sm leading-relaxed">
          {gained >= 2
            ? `Excellent travail ! Tu as gagné ${gained} kg. Continue sur cette lancée, chaque semaine compte !`
            : gained > 0
            ? `Tu progresses bien ! ${gained} kg de gagnés. La constance est la clé du succès.`
            : 'Reste discipliné dans ton alimentation et tes entraînements. Les premiers résultats arrivent d\'ici 3-4 semaines !'}
        </p>
      </div>

      {/* Meals tracking summary */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Repas cette semaine</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-900/50 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2.5 rounded-full"
              style={{ width: `${Math.min(100, (totalMealsDone / Math.max(1, checkins.length * 4)) * 100)}%` }}
            />
          </div>
          <span className="text-white font-bold text-sm">{totalMealsDone}</span>
        </div>
        <p className="text-slate-500 text-xs mt-1.5">repas enregistrés</p>
      </div>
    </div>
  );
}
