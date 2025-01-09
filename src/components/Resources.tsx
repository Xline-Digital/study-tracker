import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, BookOpen, Video, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Resource } from '../types';
import toast from 'react-hot-toast';

export function ResourceList() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    type: 'article',
    subject: '',
    link: '',
    notes: ''
  });

  useEffect(() => {
    fetchResources();
  }, []);

  async function fetchResources() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      toast.error('Error loading resources');
    } finally {
      setLoading(false);
    }
  }

  async function addResource(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase.from('resources').insert([{
        ...newResource,
        user_id: user.id
      }]);

      if (error) throw error;
      
      toast.success('Resource added');
      setShowForm(false);
      setNewResource({
        title: '',
        type: 'article',
        subject: '',
        link: '',
        notes: ''
      });
      fetchResources();
    } catch (error) {
      toast.error('Error adding resource');
    }
  }

  const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'book':
        return <BookOpen className="w-5 h-5" />;
      case 'note':
        return <FileText className="w-5 h-5" />;
      default:
        return <LinkIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return <div className="p-6">Loading resources...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Study Resources</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      {showForm && (
        <form onSubmit={addResource} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                required
                value={newResource.title}
                onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={newResource.type}
                onChange={(e) => setNewResource({...newResource, type: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="video">Video</option>
                <option value="article">Article</option>
                <option value="book">Book</option>
                <option value="note">Note</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                required
                value={newResource.subject}
                onChange={(e) => setNewResource({...newResource, subject: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Link (optional)</label>
              <input
                type="url"
                value={newResource.link}
                onChange={(e) => setNewResource({...newResource, link: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={newResource.notes}
                onChange={(e) => setNewResource({...newResource, notes: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Add Resource
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <TypeIcon type={resource.type} />
                <h3 className="text-lg font-semibold text-gray-800">
                  {resource.title}
                </h3>
              </div>
              <span className="text-sm text-gray-500">{resource.subject}</span>
            </div>
            {resource.notes && (
              <p className="text-gray-600 mb-2">{resource.notes}</p>
            )}
            {resource.link && (
              <a
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <LinkIcon className="w-4 h-4" />
                View Resource
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}