import React from 'react';
import { BookOpen, Clock, CheckCircle, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StudyReport } from './StudyReport';
import { Goals } from './Goals';
import { StudyHourGoals } from './StudyHourGoals';

export function Dashboard() {
  const [stats, setStats] = React.useState({
    totalSessions: 0,
    totalHours: 0,
    completedTasks: 0,
    activeGoals: 0
  });

  React.useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Fetch study sessions stats
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('duration');
      
      // Fetch completed tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'completed');

      // Fetch active goals
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .neq('status', 'completed');

      setStats({
        totalSessions: sessions?.length || 0,
        totalHours: Math.round((sessions?.reduce((acc, session) => acc + session.duration, 0) || 0) / 60),
        completedTasks: tasks?.length || 0,
        activeGoals: goals?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Study Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Goals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeGoals}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <StudyHourGoals />
        <Goals />
      </div>

      <StudyReport />
    </div>
  );
}