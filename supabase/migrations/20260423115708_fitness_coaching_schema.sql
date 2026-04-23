/*
  # Fitness Coaching App - Schema Initial

  1. Nouvelles Tables
    - `user_profiles` - Profil utilisateur (poids, taille, âge, niveau, date de début)
    - `weight_logs` - Historique du poids
    - `workout_logs` - Journal des entraînements (exercices complétés)
    - `meal_logs` - Journal des repas
    - `daily_checkins` - Bilan journalier (entraînement + repas complétés)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Accès restreint au propriétaire des données
*/

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  age integer DEFAULT 25,
  weight numeric(5,1) NOT NULL DEFAULT 60,
  height integer NOT NULL DEFAULT 170,
  level text NOT NULL DEFAULT 'beginner',
  start_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Weight logs
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight numeric(5,1) NOT NULL,
  logged_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own weight logs"
  ON weight_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs"
  ON weight_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight logs"
  ON weight_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs"
  ON weight_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Workout logs
CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_date date DEFAULT CURRENT_DATE,
  exercise_name text NOT NULL,
  sets_completed integer DEFAULT 0,
  reps_completed integer DEFAULT 0,
  weight_used numeric(5,1) DEFAULT 0,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own workout logs"
  ON workout_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs"
  ON workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs"
  ON workout_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs"
  ON workout_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Meal logs
CREATE TABLE IF NOT EXISTS meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_date date DEFAULT CURRENT_DATE,
  meal_type text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
  ON meal_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON meal_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON meal_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Daily check-ins
CREATE TABLE IF NOT EXISTS daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  checkin_date date DEFAULT CURRENT_DATE,
  workout_completed boolean DEFAULT false,
  meals_completed integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own checkins"
  ON daily_checkins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins"
  ON daily_checkins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins"
  ON daily_checkins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, checkin_date DESC);
