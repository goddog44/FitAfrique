import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell, User, Ruler, Weight, Target, ChevronRight, Loader, Trophy } from 'lucide-react';
import type { Level } from '../../types';

interface Props {
  onComplete: () => void;
}

export default function ProfileSetup({ onComplete }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    level: 'beginner' as Level,
  });

  const update = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase.from('user_profiles').insert({
        user_id: user.id,
        name: form.name,
        age: parseInt(form.age),
        weight: parseFloat(form.weight),
        height: parseInt(form.height),
        level: form.level,
        start_date: new Date().toISOString().split('T')[0],
      });

      // Log initial weight
      await supabase.from('weight_logs').insert({
        user_id: user.id,
        weight: parseFloat(form.weight),
        logged_date: new Date().toISOString().split('T')[0],
      });

      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-2xl mb-3 shadow-lg shadow-emerald-500/30">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Crée ton profil</h1>
          <p className="text-slate-400 text-sm mt-1">Pour un programme 100% personnalisé</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Qui es-tu ?</h2>
                  <p className="text-slate-400 text-xs">Étape 1/3</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Ex : Kofi"
                  className="w-full bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Âge</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => update('age', e.target.value)}
                  placeholder="Ex : 22"
                  min="14"
                  max="60"
                  className="w-full bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!form.name || !form.age}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-200"
              >
                Continuer <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Body */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Ton corps</h2>
                  <p className="text-slate-400 text-xs">Étape 2/3</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Poids actuel (kg)
                </label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => update('weight', e.target.value)}
                    placeholder="Ex : 65"
                    min="30"
                    max="200"
                    step="0.1"
                    className="w-full bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Taille (cm)
                </label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={form.height}
                    onChange={(e) => update('height', e.target.value)}
                    placeholder="Ex : 175"
                    min="100"
                    max="250"
                    className="w-full bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl py-3 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!form.weight || !form.height}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-200"
                >
                  Continuer <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Level */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Ton niveau</h2>
                  <p className="text-slate-400 text-xs">Étape 3/3</p>
                </div>
              </div>

              <p className="text-slate-400 text-sm">Quel est ton niveau de fitness actuel ?</p>

              {[
                {
                  value: 'beginner',
                  label: 'Débutant',
                  desc: 'Peu ou pas d\'expérience en musculation. Programme 3j/semaine.',
                  icon: Trophy,
                  color: 'emerald',
                },
                {
                  value: 'intermediate',
                  label: 'Intermédiaire',
                  desc: '6+ mois d\'expérience. Programme 4j/semaine plus intense.',
                  icon: Dumbbell,
                  color: 'teal',
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update('level', opt.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    form.level === opt.value
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-900/30 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <opt.icon className={`w-5 h-5 mt-0.5 ${form.level === opt.value ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <div>
                      <div className={`font-semibold text-sm ${form.level === opt.value ? 'text-emerald-300' : 'text-white'}`}>
                        {opt.label}
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">{opt.desc}</div>
                    </div>
                  </div>
                </button>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl py-3 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-200"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Démarrer <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
