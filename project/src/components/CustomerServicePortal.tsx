import { useState, useEffect } from 'react';
import { X, HeadphonesIcon, AlertCircle, MessageSquare, Lightbulb, ChevronDown, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type CustomerServicePortalProps = {
  onClose: () => void;
  onAuthClick: (mode: 'login' | 'signup') => void;
};

type ComplaintType = 'pharmacy' | 'general' | 'suggestion';

type Pharmacy = {
  id: string;
  name: string;
  address: string;
};

export function CustomerServicePortal({ onClose, onAuthClick }: CustomerServicePortalProps) {
  const { user } = useAuth();
  const [complaintType, setComplaintType] = useState<ComplaintType>('general');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPharmacies = async () => {
      const { data } = await supabase
        .from('pharmacies')
        .select('id, name, address')
        .order('name', { ascending: true });
      if (data) setPharmacies(data);
    };
    fetchPharmacies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    // Build payload — only include pharmacy_id when it's actually selected
    const payload: Record<string, any> = {
      user_id: user.id,
      user_email: user.email ?? '',
      complaint_type: complaintType,
      subject: subject.trim(),
      description: description.trim(),
      status: 'open',
    };

    if (complaintType === 'pharmacy' && selectedPharmacyId) {
      payload.pharmacy_id = selectedPharmacyId;
    }

    // Log to browser console so you can inspect the exact Supabase error
    console.log('Submitting complaint:', payload);

    const { error: insertError } = await supabase
      .from('complaints')
      .insert([payload])
      .select();

    setLoading(false);

    if (insertError) {
      // Show the REAL error message from Supabase (not a generic one)
      console.error('Supabase error:', insertError);
      setError(`Submission failed: ${insertError.message}`);
    } else {
      setSubmitted(true);
    }
  };

  const typeOptions: { key: ComplaintType; label: string; icon: React.ReactNode }[] = [
    { key: 'pharmacy', label: 'Pharmacy Complaint', icon: <AlertCircle className="w-5 h-5" /> },
    { key: 'general', label: 'General Complaint', icon: <MessageSquare className="w-5 h-5" /> },
    { key: 'suggestion', label: 'Suggestion', icon: <Lightbulb className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-amber-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-600 p-2 rounded-xl">
              <HeadphonesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Customer Service</h2>
              <p className="text-amber-200 text-xs">We're here to help you</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-600 rounded-full transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6">

          {/* Not logged in */}
          {!user ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HeadphonesIcon className="w-8 h-8 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Login Required</h3>
              <p className="text-gray-500 text-sm mb-6">
                Please log in to submit a complaint or suggestion. This helps us follow up with you.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { onClose(); onAuthClick('login'); }}
                  className="px-6 py-2.5 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium text-sm"
                >
                  Log In
                </button>
                <button
                  onClick={() => { onClose(); onAuthClick('signup'); }}
                  className="px-6 py-2.5 border-2 border-amber-700 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors font-medium text-sm"
                >
                  Sign Up
                </button>
              </div>
            </div>

          ) : submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Submitted Successfully!</h3>
              <p className="text-gray-500 text-sm mb-6">
                Thank you for reaching out. Our team will review your submission and get back to you at <strong>{user.email}</strong>.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium text-sm"
              >
                Close
              </button>
            </div>

          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Complaint Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  What is this about?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => { setComplaintType(opt.key); setSelectedPharmacyId(''); }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                        complaintType === opt.key
                          ? 'border-amber-600 bg-amber-50 text-amber-800'
                          : 'border-gray-200 text-gray-500 hover:border-amber-300 hover:bg-amber-50/50'
                      }`}
                    >
                      <span className={complaintType === opt.key ? 'text-amber-700' : 'text-gray-400'}>
                        {opt.icon}
                      </span>
                      <span className="text-xs font-medium leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pharmacy selector */}
              {complaintType === 'pharmacy' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Select Pharmacy <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedPharmacyId}
                      onChange={(e) => setSelectedPharmacyId(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none appearance-none bg-white text-sm"
                    >
                      <option value="">-- Choose a pharmacy --</option>
                      {pharmacies.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.address}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="Brief summary of your concern"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  maxLength={1000}
                  placeholder="Please describe your issue or suggestion in detail..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm resize-none"
                />
                <p className="text-right text-xs text-gray-400 mt-1">{description.length}/1000</p>
              </div>

              {/* Submitting as */}
              <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-amber-700 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <p className="text-xs text-amber-800">
                  Submitting as <strong>{user.email}</strong>
                </p>
              </div>

              {/* Error — now shows the REAL Supabase message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}