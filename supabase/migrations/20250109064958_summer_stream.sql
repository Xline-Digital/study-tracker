/*
  # Add Goals and Related Tables

  1. New Tables
    - `goals`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `type` (text: 'short-term' or 'long-term')
      - `target_date` (date)
      - `progress` (integer)
      - `status` (text: 'not-started', 'in-progress', 'completed')
      - `user_id` (uuid, foreign key)
    - `milestones`
      - `id` (uuid, primary key)
      - `title` (text)
      - `completed` (boolean)
      - `goal_id` (uuid, foreign key)
    - `goal_tasks`
      - `goal_id` (uuid, foreign key)
      - `task_id` (uuid, foreign key)
    - `goal_sessions`
      - `goal_id` (uuid, foreign key)
      - `session_id` (uuid, foreign key)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('short-term', 'long-term')),
  target_date date NOT NULL,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status text NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed')),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  completed boolean DEFAULT false,
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage milestones for their goals"
  ON milestones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = milestones.goal_id
      AND goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = milestones.goal_id
      AND goals.user_id = auth.uid()
    )
  );

-- Goal-Task relationship table
CREATE TABLE IF NOT EXISTS goal_tasks (
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (goal_id, task_id)
);

ALTER TABLE goal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage goal-task relationships for their goals"
  ON goal_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_tasks.goal_id
      AND goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_tasks.goal_id
      AND goals.user_id = auth.uid()
    )
  );

-- Goal-Session relationship table
CREATE TABLE IF NOT EXISTS goal_sessions (
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  session_id uuid REFERENCES study_sessions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (goal_id, session_id)
);

ALTER TABLE goal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage goal-session relationships for their goals"
  ON goal_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_sessions.goal_id
      AND goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_sessions.goal_id
      AND goals.user_id = auth.uid()
    )
  );

-- Function to update goal progress based on completed tasks
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE goals
  SET progress = (
    SELECT COALESCE(
      ROUND(
        (COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::numeric / 
        NULLIF(COUNT(*)::numeric, 0) * 100
      )::numeric
    ), 0)
    FROM goal_tasks gt
    JOIN tasks t ON t.id = gt.task_id
    WHERE gt.goal_id = NEW.goal_id
    GROUP BY gt.goal_id
  )
  WHERE id = NEW.goal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update goal progress when tasks are added or updated
CREATE TRIGGER update_goal_progress_trigger
AFTER INSERT OR UPDATE ON goal_tasks
FOR EACH ROW
EXECUTE FUNCTION update_goal_progress();