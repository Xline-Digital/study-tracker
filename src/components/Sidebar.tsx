import React from 'react';
import { BookOpen, ListTodo, Timer, BookMarked, Layout, UserCircle } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: Layout, label: 'Dashboard' },
    { id: 'tasks', icon: ListTodo, label: 'Tasks' },
    { id: 'sessions', icon: Timer, label: 'Study Sessions' },
    { id: 'resources', icon: BookMarked, label: 'Resources' },
    { id: 'profile', icon: UserCircle, label: 'Profile' },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-8">
        <BookOpen className="w-8 h-8 text-indigo-600" />
        <h1 className="text-xl font-bold text-gray-800">StudyTracker</h1>
      </div>
      <nav>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
              activeTab === item.id
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}