import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { HeadphonesIcon, AlertCircle, MessageSquare, Lightbulb, ChevronDown, RefreshCw, LogOut } from 'lucide-react';

type Complaint = {
  id: string;
  user_email: string;
  complaint_type: 'pharmacy' | 'general' | 'suggestion';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  pharmacy_name?: string;
};

export function AdminComplaintsInbox() {
  const { signOut } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pharmacy' | 'general' | 'suggestion'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        id,
        user_email,
        complaint_type,
        subject,
        description,
        status,
        created_at,
        pharmacy:pharmacies (name)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComplaints(data.map((c: any) => ({
        ...c,
        pharmacy_name: c.pharmacy?.name ?? null,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateStatus = async (id: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    setUpdatingId(id);
    await supabase.from('complaints').update({ status: newStatus }).eq('id', id);
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    setUpdatingId(null);
  };

  const filtered = complaints.filter((c) => {
    const statusOk = filter === 'all' || c.status === filter;
    const typeOk = typeFilter === 'all' || c.complaint_type === typeFilter;
    return statusOk && typeOk;
  });

  const counts = {
    all: complaints.length,
    open: complaints.filter((c) => c.status === 'open').length,
    in_progress: complaints.filter((c) => c.status === 'in_progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };

  const typeIcon = (type: string) => {
    if (type === 'pharmacy') return <AlertCircle className="w-4 h-4" />;
    if (type === 'suggestion') return <Lightbulb className="w-4 h-4" />;
    return <MessageSquare className="w-4 h-4" />;
  };

  const typeColor = (type: string) => {
    if (type === 'pharmacy') return 'bg-red-100 text-red-700';
    if (type === 'suggestion') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const statusColor = (status: string) => {
    if (status === 'open') return 'bg-amber-100 text-amber-800';
    if (status === 'in_progress') return 'bg-purple-100 text-purple-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-amber-700 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src="/ChatGPT_Image_Jan_22__2026__11_25_31_PM-removebg-preview_(1).png"
            alt="MediTrack Logo"
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-xl font-bold">Admin — Complaints Inbox</h1>
            <p className="text-amber-200 text-xs">MediTrack Customer Service</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchComplaints}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 bg-amber-800 hover:bg-amber-900 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', key: 'all', color: 'bg-white border-gray-200 text-gray-800' },
            { label: 'Open', key: 'open', color: 'bg-amber-50 border-amber-200 text-amber-800' },
            { label: 'In Progress', key: 'in_progress', color: 'bg-purple-50 border-purple-200 text-purple-800' },
            { label: 'Resolved', key: 'resolved', color: 'bg-green-50 border-green-200 text-green-800' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key as any)}
              className={`${s.color} border-2 rounded-xl p-4 text-left transition-all hover:shadow-md ${filter === s.key ? 'ring-2 ring-amber-500 ring-offset-1' : ''}`}
            >
              <p className="text-2xl font-bold">{counts[s.key as keyof typeof counts]}</p>
              <p className="text-sm font-medium opacity-80">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <span className="text-sm font-semibold text-gray-600">Filter by type:</span>
          {(['all', 'pharmacy', 'general', 'suggestion'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                typeFilter === t ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>

        {/* Complaints List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <HeadphonesIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Loading complaints...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl">
              <HeadphonesIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No complaints found</p>
              <p className="text-sm">Try changing the filters</p>
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Card Header */}
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${typeColor(c.complaint_type)}`}>
                      {typeIcon(c.complaint_type)}
                      <span className="capitalize">{c.complaint_type}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{c.subject}</p>
                      <p className="text-xs text-gray-400">
                        {c.user_email} · {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {c.pharmacy_name && <span className="ml-2 text-red-500">· {c.pharmacy_name}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(c.status)}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === c.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedId === c.id && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                    {c.pharmacy_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-600">Pharmacy:</span>
                        <span className="text-red-600 font-semibold">{c.pharmacy_name}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">{c.description}</p>
                    </div>

                    {/* Status Updater */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-gray-600">Update Status:</span>
                      {(['open', 'in_progress', 'resolved'] as const).map((s) => (
                        <button
                          key={s}
                          disabled={c.status === s || updatingId === c.id}
                          onClick={() => updateStatus(c.id, s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${statusColor(s)} border border-current/20 hover:opacity-80`}
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                      {updatingId === c.id && (
                        <span className="text-xs text-gray-400">Updating...</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}