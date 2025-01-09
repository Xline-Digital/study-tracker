import React, { useState, useEffect } from 'react';
import { Plus, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface StudyHourGoal {
  id: string;
  target_hours: number;
  period: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  progress?: number;
}

export function StudyHourGoals() {
  const [goals, setGoals] = useState<StudyHourGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    target_hours: 1,
    period: 'daily',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: goals, error } = await supabase
        .from('study_hour_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate progress for each goal
      const goalsWithProgress = await Promise.all((goals || []).map(async (goal) => {
        const { data } = await supabase.rpc('calculate_study_hours_progress', {
          p_user_id: user.id,
          p_start_date: goal.start_date,
          p_end_date: goal.end_date
        });

        const progress = data?.[0]?.total_hours || 0;
        const progressPercentage = Math.min(100, (progress / goal.target_hours) * 100);

        return {
          ...goal,
          progress: progressPercentage
        };
      }));

      setGoals(goalsWithProgress);
    } catch (error) {
      toast.error('Error loading study hour goals');
    } finally {
      setLoading(false);
    }
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('study_hour_goals')
        .insert([{
          ...newGoal,
          user_id: user.id
        }]);

      if (error) throw error;

      toast.success('Study hour goal added');
      setShowForm(false);
      setNewGoal({
        target_hours: 1,
        period: 'daily',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
      fetchGoals();
    } catch (error) {
      toast.error('Error adding study hour goal');
    }
  }

  if (loading) {
    return <div>Loading study hour goals...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Study Hour Goals</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          Add Goal
        </button>
      </div>

      {showForm && (
        <form onSubmit={addGoal} className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Target Hours</label>
            <input
              type="number"
              min="1"
              required
              value={newGoal.target_hours}
              onChange={(e) => setNewGoal({ ...newGoal, target_hours: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Period</label>
            <select
              value={newGoal.period}
              onChange={(e) => setNewGoal({ ...newGoal, period: e.target.value as 'daily' | 'weekly' | 'monthly' })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              required
              value={newGoal.start_date}
              onChange={(e) => setNewGoal({ ...newGoal, start_date: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              required
              value={newGoal.end_date}
              onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Add Goal
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">
                  {goal.target_hours} hours ({goal.period})
                </h4>
                <p className="text-sm text-gray-600">
                  {new Date(goal.start_date).toLocaleDateString()} - {new Date(goal.end_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <span className="font-medium">{Math.round(goal.progress || 0)}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${goal.progress || 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}