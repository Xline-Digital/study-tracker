/*
  # Add Study Hours Goals and Reports

  1. New Tables
    - `study_hour_goals`
      - `id` (uuid, primary key)
      - `target_hours` (integer)
      - `period` (text: 'daily', 'weekly', 'monthly')
      - `start_date` (date)
      - `end_date` (date)
      - `user_id` (uuid, foreign key)

  2. Functions
    - Calculate study progress for different time periods
    - Generate detailed study reports
*/

-- Study Hour Goals table
CREATE TABLE IF NOT EXISTS study_hour_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_hours integer NOT NULL CHECK (target_hours > 0),
  period text NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

ALTER TABLE study_hour_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own study hour goals"
  ON study_hour_goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate study hours progress
CREATE OR REPLACE FUNCTION calculate_study_hours_progress(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  total_hours numeric,
  total_sessions integer,
  avg_session_duration numeric,
  subjects_covered text[],
  daily_average numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(SUM(duration)::numeric / 60, 1) as total_hours,
    COUNT(*)::integer as total_sessions,
    ROUND(AVG(duration)::numeric, 1) as avg_session_duration,
    ARRAY_AGG(DISTINCT subject) as subjects_covered,
    ROUND(SUM(duration)::numeric / 60 / GREATEST(1, p_end_date - p_start_date), 1) as daily_average
  FROM study_sessions
  WHERE user_id = p_user_id
    AND date >= p_start_date
    AND date <= p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to generate detailed study report
CREATE OR REPLACE FUNCTION generate_study_report(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  date date,
  subject text,
  duration numeric,
  notes text,
  goal_title text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ss.date,
    ss.subject,
    ROUND(ss.duration::numeric / 60, 1) as hours,
    ss.notes,
    g.title as goal_title
  FROM study_sessions ss
  LEFT JOIN goal_sessions gs ON ss.id = gs.session_id
  LEFT JOIN goals g ON gs.goal_id = g.id
  WHERE ss.user_id = p_user_id
    AND ss.date >= p_start_date
    AND ss.date <= p_end_date
  ORDER BY ss.date DESC;
END;
$$ LANGUAGE plpgsql;