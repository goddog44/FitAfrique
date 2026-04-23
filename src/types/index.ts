export type Level = 'beginner' | 'intermediate';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  level: Level;
  start_date: string;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
  muscleGroup: string;
}

export interface WorkoutPlan {
  type: 'A' | 'B' | 'C' | 'D' | 'rest';
  title: string;
  exercises: Exercise[];
  durationMin: number;
  isRestDay: boolean;
}

export interface MealItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  label: string;
  time: string;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
}

export interface NutritionPlan {
  targetCalories: number;
  targetProtein: number;
  meals: Meal[];
}

export interface ScheduleItem {
  time: string;
  activity: string;
  category: 'sleep' | 'meal' | 'workout' | 'rest' | 'water';
  icon: string;
}

export interface DayPlan {
  weekNumber: number;
  dayNumber: number;
  dayOfWeek: number;
  workout: WorkoutPlan;
  nutrition: NutritionPlan;
  schedule: ScheduleItem[];
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  logged_date: string;
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  logged_date: string;
  exercise_name: string;
  sets_completed: number;
  reps_completed: number;
  weight_used: number;
  completed: boolean;
}

export interface MealLog {
  id: string;
  user_id: string;
  logged_date: string;
  meal_type: string;
  completed: boolean;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  workout_completed: boolean;
  meals_completed: number;
  notes: string;
}
