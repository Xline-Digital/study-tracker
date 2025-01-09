import React, { useState, useEffect } from 'react';
import { Plus, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Goal } from '../types';
import toast from 'react-hot-toast';

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'short-term',
    target_date: '',
    milestones: ['']
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          milestones (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      toast.error('Error loading goals');
    } finally {
      setLoading(false);
    }
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Insert goal
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .insert([{
          title: newGoal.title,
          description: newGoal.description,
          type: newGoal.type,
          target_date: newGoal.target_date,
          user_id: user.id
        }])
        .select()
        .single();

      if (goalError) throw goalError;

      // Insert milestones
      if (goalData && newGoal.milestones.length > 0) {
        const { error: milestoneError } = await supabase
          .from('milestones')
          .insert(
            newGoal.milestones
              .filter(m => m.trim())
              .map(title => ({
                title,
                goal_id: goalData.id
              }))
          );

        if (milestoneError) throw milestoneError;
      }

      toast.success('Goal added successfully');
      setShowForm(false);
      setNewGoal({
        title: '',
        description: '',
        type: 'short-term',
        target_date: '',
        milestones: ['']
      });
      fetchGoals();
    } catch (error) {
      toast.error('Error adding goal');
    }
  }

  async function toggleMilestone(milestoneId: string, completed: boolean) {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({ completed })
        .eq('id', milestoneId);

      if (error) throw error;
      fetchGoals();
    } catch (error) {
      toast.error('Error updating milestone');
    }
  }

  if (loading) {
    return <div>Loading goals...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Goals</h3>
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
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              required
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={newGoal.type}
              onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="short-term">Short Term</option>
              <option value="long-term">Long Term</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Target Date</label>
            <input
              type="date"
              required
              value={newGoal.target_date}
              onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Milestones</label>
            {newGoal.milestones.map((milestone, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={milestone}
                  onChange={(e) => {
                    const updatedMilestones = [...newGoal.milestones];
                    updatedMilestones[index] = e.target.value;
                    setNewGoal({ ...newGoal, milestones: updatedMilestones });
                  }}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Enter milestone"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updatedMilestones = newGoal.milestones.filter((_, i) => i !== index);
                    setNewGoal({ ...newGoal, milestones: updatedMilestones });
                  }}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNewGoal({ ...newGoal, milestones: [...newGoal.milestones, ''] })}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
            >
              + Add Milestone
            </button>
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
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">{goal.title}</h4>
                <p className="text-sm text-gray-600">{goal.description}</p>
              </div>
              <button
                onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {expandedGoal === goal.id ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span className="capitalize">{goal.type}</span>
              <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>
              <span className="capitalize">Status: {goal.status}</span>
            </div>

            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${goal.progress}%` }}
              ></div>
            </div>

            {expandedGoal === goal.id && goal.milestones && (
              <div className="mt-4 space-y-2">
                <h5 className="font-medium text-gray-700">Milestones</h5>
                {goal.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={milestone.completed}
                      onChange={(e) => toggleMilestone(milestone.id, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={milestone.completed ? 'line-through text-gray-500' : ''}>
                      {milestone.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}