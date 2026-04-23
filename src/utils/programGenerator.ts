import type {
  UserProfile,
  DayPlan,
  WorkoutPlan,
  Exercise,
  NutritionPlan,
  Meal,
  ScheduleItem,
  Level,
} from '../types';

// ─── Progression helpers ────────────────────────────────────────────────────

function getDaysSinceStart(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
}

function getWeekNumber(daysSinceStart: number): number {
  return Math.floor(daysSinceStart / 7) + 1;
}

// ─── Workout generation ──────────────────────────────────────────────────────

interface ProgressionTier {
  sets: number;
  reps: string;
  restSeconds: number;
}

function getProgression(level: Level, week: number): ProgressionTier {
  if (level === 'beginner') {
    if (week <= 2) return { sets: 2, reps: '8-10', restSeconds: 90 };
    if (week <= 4) return { sets: 3, reps: '10-12', restSeconds: 75 };
    if (week <= 6) return { sets: 3, reps: '12-15', restSeconds: 60 };
    return { sets: 3, reps: '15+', restSeconds: 60 };
  }
  // intermediate
  if (week <= 2) return { sets: 3, reps: '10-12', restSeconds: 75 };
  if (week <= 4) return { sets: 4, reps: '12-15', restSeconds: 60 };
  if (week <= 6) return { sets: 4, reps: '15+', restSeconds: 45 };
  return { sets: 5, reps: '15-20', restSeconds: 45 };
}

function makePushups(tier: ProgressionTier, week: number): Exercise {
  const variant =
    week <= 2
      ? 'Pompes classiques'
      : week <= 4
      ? 'Pompes élargies'
      : week <= 6
      ? 'Pompes déclinées'
      : 'Pompes diamant';
  return {
    name: variant,
    sets: tier.sets,
    reps: tier.reps,
    restSeconds: tier.restSeconds,
    muscleGroup: 'Pectoraux / Triceps',
  };
}

function makeSquats(tier: ProgressionTier, week: number): Exercise {
  const variant =
    week <= 3
      ? 'Squats au poids du corps'
      : week <= 6
      ? 'Squats sautés'
      : 'Squats bulgares';
  return {
    name: variant,
    sets: tier.sets,
    reps: tier.reps,
    restSeconds: tier.restSeconds,
    muscleGroup: 'Cuisses / Fessiers',
  };
}

function makePullups(tier: ProgressionTier, week: number, level: Level): Exercise {
  const variant =
    level === 'beginner' && week <= 3
      ? 'Tractions assistées (bande ou chaise)'
      : week <= 6
      ? 'Tractions prise large'
      : 'Tractions lestées';
  return {
    name: variant,
    sets: tier.sets,
    reps: level === 'beginner' && week <= 3 ? '5-8' : tier.reps,
    restSeconds: tier.restSeconds + 15,
    muscleGroup: 'Dos / Biceps',
  };
}

function makeDips(tier: ProgressionTier, week: number): Exercise {
  const variant =
    week <= 3
      ? 'Dips sur chaise'
      : week <= 6
      ? 'Dips parallèles'
      : 'Dips lestés';
  return {
    name: variant,
    sets: tier.sets,
    reps: tier.reps,
    restSeconds: tier.restSeconds,
    muscleGroup: 'Triceps / Épaules',
  };
}

function makeLunges(tier: ProgressionTier, week: number): Exercise {
  const variant =
    week <= 3
      ? 'Fentes avant'
      : week <= 6
      ? 'Fentes latérales'
      : 'Fentes marchées lestées';
  return {
    name: variant,
    sets: tier.sets,
    reps: `${tier.reps} par jambe`,
    restSeconds: tier.restSeconds,
    muscleGroup: 'Cuisses / Fessiers',
  };
}

function makeCurls(tier: ProgressionTier, week: number): Exercise {
  const variant =
    week <= 3
      ? 'Curls biceps (bouteilles d\'eau lestées)'
      : week <= 6
      ? 'Curls concentrés'
      : 'Curls marteau';
  return {
    name: variant,
    sets: tier.sets,
    reps: tier.reps,
    restSeconds: tier.restSeconds,
    muscleGroup: 'Biceps',
  };
}

function makePlank(tier: ProgressionTier, week: number): Exercise {
  const duration = week <= 2 ? '20-30 sec' : week <= 4 ? '30-45 sec' : week <= 6 ? '45-60 sec' : '60+ sec';
  return {
    name: week <= 4 ? 'Gainage frontal' : 'Gainage + rotations',
    sets: tier.sets,
    reps: duration,
    restSeconds: 45,
    muscleGroup: 'Abdominaux / Core',
  };
}

function makeBenchPress(tier: ProgressionTier, week: number): Exercise {
  const variant =
    week <= 3
      ? 'Développé couché (jerricans / haltères maison)'
      : week <= 6
      ? 'Développé incliné'
      : 'Développé décliné';
  return {
    name: variant,
    sets: tier.sets,
    reps: tier.reps,
    restSeconds: tier.restSeconds + 15,
    muscleGroup: 'Pectoraux',
  };
}

type WorkoutType = 'A' | 'B' | 'C' | 'D';

function buildWorkout(type: WorkoutType, level: Level, week: number): WorkoutPlan {
  const tier = getProgression(level, week);

  if (type === 'A') {
    return {
      type: 'A',
      title: 'Séance A — Poussée (Push)',
      isRestDay: false,
      durationMin: 45,
      exercises: [
        makePushups(tier, week),
        makeBenchPress(tier, week),
        makeDips(tier, week),
        makeSquats(tier, week),
        makePlank(tier, week),
      ],
    };
  }

  if (type === 'B') {
    return {
      type: 'B',
      title: 'Séance B — Tirage (Pull)',
      isRestDay: false,
      durationMin: 45,
      exercises: [
        makePullups(tier, week, level),
        makeCurls(tier, week),
        {
          name: week <= 4 ? 'Rowing inversé (table)' : 'Rowing haltères',
          sets: tier.sets,
          reps: tier.reps,
          restSeconds: tier.restSeconds,
          muscleGroup: 'Dos / Biceps',
        },
        makeLunges(tier, week),
        makePlank(tier, week),
      ],
    };
  }

  if (type === 'C') {
    return {
      type: 'C',
      title: 'Séance C — Corps entier',
      isRestDay: false,
      durationMin: 55,
      exercises: [
        makePushups(tier, week),
        makeSquats(tier, week),
        makePullups(tier, week, level),
        makeLunges(tier, week),
        makeDips(tier, week),
        makePlank(tier, week),
      ],
    };
  }

  // D — intermediate only
  return {
    type: 'D',
    title: 'Séance D — Jambes & Épaules',
    isRestDay: false,
    durationMin: 50,
    exercises: [
      makeSquats(tier, week),
      makeLunges(tier, week),
      {
        name: week <= 4 ? 'Développé militaire (haltères)' : 'Développé Arnold',
        sets: tier.sets,
        reps: tier.reps,
        restSeconds: tier.restSeconds,
        muscleGroup: 'Épaules',
      },
      {
        name: 'Élévations latérales',
        sets: tier.sets,
        reps: tier.reps,
        restSeconds: tier.restSeconds,
        muscleGroup: 'Épaules',
      },
      makePlank(tier, week),
    ],
  };
}

function getWorkoutForDay(dayOfWeek: number, level: Level, week: number): WorkoutPlan {
  const rest: WorkoutPlan = {
    type: 'rest',
    title: 'Jour de Repos & Récupération',
    isRestDay: true,
    exercises: [],
    durationMin: 0,
  };

  if (level === 'beginner') {
    // Mon=1 → A, Wed=3 → B, Fri=5 → C, rest other days
    if (dayOfWeek === 1) return buildWorkout('A', level, week);
    if (dayOfWeek === 3) return buildWorkout('B', level, week);
    if (dayOfWeek === 5) return buildWorkout('C', level, week);
    return rest;
  }

  // intermediate: Mon=A, Tue=B, Thu=C, Fri=D
  if (dayOfWeek === 1) return buildWorkout('A', level, week);
  if (dayOfWeek === 2) return buildWorkout('B', level, week);
  if (dayOfWeek === 4) return buildWorkout('C', level, week);
  if (dayOfWeek === 5) return buildWorkout('D', level, week);
  return rest;
}

// ─── Nutrition generation ────────────────────────────────────────────────────

function computeCalories(weight: number, height: number, age: number): number {
  // Mifflin-St Jeor (homme)
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  // Modérément actif × 1.55 + surplus 500 kcal
  return Math.round(bmr * 1.55 + 500);
}

function computeProtein(weight: number): number {
  // 1.8g per kg for muscle gain
  return Math.round(weight * 1.8);
}

function buildNutrition(
  weight: number,
  height: number,
  age: number,
  isWorkoutDay: boolean,
  week: number
): NutritionPlan {
  const targetCalories = computeCalories(weight, height, age);
  const targetProtein = computeProtein(weight);

  const extraCal = week >= 3 ? 50 : 0; // slight bump after first 2 weeks

  const breakfast: Meal = {
    type: 'breakfast',
    label: 'Petit-Déjeuner',
    time: '07:00',
    items: [
      {
        name: 'Bouillie enrichie (maïs + soja + arachide + avoine)',
        quantity: '1 grand bol (350 ml)',
        calories: 380 + extraCal,
        protein: 18,
      },
      {
        name: 'Œufs brouillés',
        quantity: week >= 3 ? '3 œufs' : '2 œufs',
        calories: week >= 3 ? 225 : 150,
        protein: week >= 3 ? 18 : 12,
      },
      { name: 'Lait entier', quantity: '1 verre (250 ml)', calories: 155, protein: 8 },
      { name: 'Banane mûre', quantity: '1 grande', calories: 105, protein: 1 },
    ],
    totalCalories: 0,
    totalProtein: 0,
  };
  breakfast.totalCalories = breakfast.items.reduce((s, i) => s + i.calories, 0);
  breakfast.totalProtein = breakfast.items.reduce((s, i) => s + i.protein, 0);

  const lunchBase = week >= 4 ? 320 : 260;
  const lunch: Meal = {
    type: 'lunch',
    label: 'Déjeuner',
    time: '13:00',
    items: [
      {
        name: week % 2 === 0 ? 'Riz blanc cuit' : 'Igname bouillie',
        quantity: week >= 3 ? '300 g' : '250 g',
        calories: lunchBase,
        protein: 6,
      },
      {
        name: week % 3 === 0 ? 'Poisson braisé' : 'Poulet grillé',
        quantity: week >= 4 ? '250 g' : '200 g',
        calories: week % 3 === 0 ? 280 : 330,
        protein: week % 3 === 0 ? 36 : 42,
      },
      { name: 'Plantain bouilli', quantity: '2 morceaux', calories: 180, protein: 2 },
      { name: 'Légumes verts (épinards, gombo)', quantity: '1 portion', calories: 60, protein: 3 },
      { name: 'Arachides grillées', quantity: '30 g', calories: 165, protein: 7 },
    ],
    totalCalories: 0,
    totalProtein: 0,
  };
  lunch.totalCalories = lunch.items.reduce((s, i) => s + i.calories, 0);
  lunch.totalProtein = lunch.items.reduce((s, i) => s + i.protein, 0);

  const snack: Meal = {
    type: 'snack',
    label: isWorkoutDay ? 'Collation Post-Entraînement' : 'Collation de l\'après-midi',
    time: isWorkoutDay ? '16:30' : '16:00',
    items: [
      { name: 'Lait entier', quantity: '1 verre (250 ml)', calories: 155, protein: 8 },
      { name: 'Banane', quantity: '1 grosse', calories: 105, protein: 1 },
      { name: 'Arachides', quantity: '40 g', calories: 220, protein: 9 },
      ...(isWorkoutDay
        ? [{ name: 'Œufs durs', quantity: '2 œufs', calories: 150, protein: 12 }]
        : []),
    ],
    totalCalories: 0,
    totalProtein: 0,
  };
  snack.totalCalories = snack.items.reduce((s, i) => s + i.calories, 0);
  snack.totalProtein = snack.items.reduce((s, i) => s + i.protein, 0);

  const dinnerBase = week >= 4 ? 240 : 200;
  const dinner: Meal = {
    type: 'dinner',
    label: 'Dîner',
    time: '19:30',
    items: [
      {
        name: week % 2 === 0 ? 'Riz au lait de coco' : 'Couscous de mil',
        quantity: '200 g',
        calories: dinnerBase,
        protein: 5,
      },
      {
        name: 'Poulet / Poisson',
        quantity: week >= 4 ? '200 g' : '150 g',
        calories: 280,
        protein: 35,
      },
      { name: 'Haricots rouges', quantity: '100 g cuit', calories: 130, protein: 9 },
      { name: 'Lait chaud avec miel', quantity: '1 verre', calories: 180, protein: 8 },
    ],
    totalCalories: 0,
    totalProtein: 0,
  };
  dinner.totalCalories = dinner.items.reduce((s, i) => s + i.calories, 0);
  dinner.totalProtein = dinner.items.reduce((s, i) => s + i.protein, 0);

  return {
    targetCalories,
    targetProtein,
    meals: [breakfast, lunch, snack, dinner],
  };
}

// ─── Schedule generation ─────────────────────────────────────────────────────

function buildSchedule(isWorkoutDay: boolean, workoutTitle: string): ScheduleItem[] {
  const base: ScheduleItem[] = [
    { time: '06:00', activity: 'Réveil & eau (500 ml)', category: 'water', icon: '💧' },
    { time: '06:15', activity: 'Étirements matinaux (10 min)', category: 'rest', icon: '🧘' },
    { time: '07:00', activity: 'Petit-Déjeuner', category: 'meal', icon: '🍚' },
    { time: '08:00', activity: 'Eau (500 ml)', category: 'water', icon: '💧' },
  ];

  if (isWorkoutDay) {
    base.push(
      { time: '09:00', activity: `Entraînement : ${workoutTitle}`, category: 'workout', icon: '🏋️' },
      { time: '10:30', activity: 'Douche & récupération', category: 'rest', icon: '🚿' },
      { time: '11:00', activity: 'Eau (500 ml)', category: 'water', icon: '💧' }
    );
  } else {
    base.push(
      { time: '09:00', activity: 'Activité légère (marche 20 min)', category: 'rest', icon: '🚶' },
      { time: '10:00', activity: 'Eau (500 ml)', category: 'water', icon: '💧' }
    );
  }

  base.push(
    { time: '13:00', activity: 'Déjeuner', category: 'meal', icon: '🍗' },
    { time: '14:00', activity: 'Repos digestif (20 min)', category: 'rest', icon: '😴' },
    { time: '15:30', activity: 'Eau (500 ml)', category: 'water', icon: '💧' },
    { time: '16:30', activity: isWorkoutDay ? 'Collation post-entraînement' : 'Collation de l\'après-midi', category: 'meal', icon: '🍌' },
    { time: '19:30', activity: 'Dîner', category: 'meal', icon: '🍽️' },
    { time: '20:30', activity: 'Eau (250 ml)', category: 'water', icon: '💧' },
    { time: '21:00', activity: 'Stretching du soir & relaxation', category: 'rest', icon: '🧘' },
    { time: '22:00', activity: 'Coucher (8h de sommeil recommandées)', category: 'sleep', icon: '🌙' }
  );

  return base;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function generateDayPlan(profile: UserProfile): DayPlan {
  const daysSinceStart = getDaysSinceStart(profile.start_date);
  const weekNumber = getWeekNumber(daysSinceStart);
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun … 6=Sat

  const workout = getWorkoutForDay(dayOfWeek, profile.level as Level, weekNumber);
  const nutrition = buildNutrition(
    profile.weight,
    profile.height,
    profile.age,
    !workout.isRestDay,
    weekNumber
  );
  const schedule = buildSchedule(!workout.isRestDay, workout.title);

  return {
    weekNumber,
    dayNumber: daysSinceStart + 1,
    dayOfWeek,
    workout,
    nutrition,
    schedule,
  };
}

export { getDaysSinceStart, getWeekNumber };
