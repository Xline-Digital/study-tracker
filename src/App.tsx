import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { StudySessionList } from './components/StudySession';
import { ResourceList } from './components/Resources';
import { Profile } from './components/Profile';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <>
        <Auth />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-auto">
          {activeTab === 'dashboard' && <Dashboard key="dashboard" />}
          {activeTab === 'tasks' && <TaskList key="tasks" />}
          {activeTab === 'sessions' && <StudySessionList key="sessions" />}
          {activeTab === 'resources' && <ResourceList key="resources" />}
          {activeTab === 'profile' && <Profile key="profile" />}
        </main>
      </div>
      <Toaster />
    </>
  );
}