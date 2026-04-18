import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type AuthModalProps = {
  mode: 'login' | 'signup';
  onClose: () => void;
};

export function AuthModal({ mode, onClose }: AuthModalProps) {
  const [accountType, setAccountType] = useState<'user' | 'pharmacy'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signInUser, signInPharmacy, signUpUser, signUpPharmacy } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;

    if (mode === 'login') {
      result = accountType === 'user'
        ? await signInUser(email, password)
        : await signInPharmacy(email, password);
    } else {
      result = accountType === 'user'
        ? await signUpUser(email, password)
        : await signUpPharmacy(email, password, pharmacyName, licenseNumber, address);
    }

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <img
              src="/ChatGPT_Image_Jan_22__2026__11_25_31_PM-removebg-preview_(1).png"
              alt="MediTrack Logo"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h2 className="text-3xl font-bold text-amber-900 mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-amber-700">
              {mode === 'login'
                ? 'Sign in to your MediTrack account'
                : 'Join MediTrack today'}
            </p>
          </div>

          <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setAccountType('user'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                accountType === 'user'
                  ? 'bg-amber-700 text-white'
                  : 'text-gray-600 hover:text-amber-700'
              }`}
            >
              I'm a User
            </button>
            <button
              type="button"
              onClick={() => { setAccountType('pharmacy'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                accountType === 'pharmacy'
                  ? 'bg-amber-700 text-white'
                  : 'text-gray-600 hover:text-amber-700'
              }`}
            >
              I'm a Pharmacy
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && accountType === 'pharmacy' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pharmacy Name
                  </label>
                  <input
                    type="text"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="e.g. City Medical Store"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="e.g. PH-2024-XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pharmacy Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="e.g. 123 Main Street, City"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? `Sign In as ${accountType === 'user' ? 'User' : 'Pharmacy'}`
                  : `Sign Up as ${accountType === 'user' ? 'User' : 'Pharmacy'}`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setError(''); onClose(); }}
              className="text-amber-700 font-medium hover:text-amber-800"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}