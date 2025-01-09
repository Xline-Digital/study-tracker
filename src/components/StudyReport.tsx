import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export function StudyReport() {
  const [dateRange, setDateRange] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generateReport() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get study progress
      const { data: progress, error: progressError } = await supabase
        .rpc('calculate_study_hours_progress', {
          p_user_id: user.id,
          p_start_date: dateRange.start_date,
          p_end_date: dateRange.end_date
        });

      if (progressError) throw progressError;

      // Get detailed report
      const { data: details, error: detailsError } = await supabase
        .rpc('generate_study_report', {
          p_user_id: user.id,
          p_start_date: dateRange.start_date,
          p_end_date: dateRange.end_date
        });

      if (detailsError) throw detailsError;

      setReport({ progress: progress[0], details });
    } catch (error) {
      toast.error('Error generating report');
    } finally {
      setLoading(false);
    }
  }

  function exportToCsv() {
    if (!report) return;

    const headers = ['Date', 'Subject', 'Hours', 'Notes', 'Related Goal'];
    const rows = report.details.map(session => [
      session.date,
      session.subject,
      session.duration,
      session.notes || '',
      session.goal_title || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-report-${dateRange.start_date}-to-${dateRange.end_date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Study Report</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={dateRange.start_date}
            onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={dateRange.end_date}
            onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={generateReport}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
        {report && (
          <button
            onClick={exportToCsv}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {report && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Total Hours</div>
              <div className="text-2xl font-bold text-gray-900">{report.progress.total_hours}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Total Sessions</div>
              <div className="text-2xl font-bold text-gray-900">{report.progress.total_sessions}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Avg. Session (min)</div>
              <div className="text-2xl font-bold text-gray-900">{report.progress.avg_session_duration}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Daily Average (hours)</div>
              <div className="text-2xl font-bold text-gray-900">{report.progress.daily_average}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Related Goal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.details.map((session, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(session.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.duration}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{session.notes}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{session.goal_title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}