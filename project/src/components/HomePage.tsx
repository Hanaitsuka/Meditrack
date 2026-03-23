import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type HomePageProps = {
  onSearch: (query: string) => void;
  onAuthClick: (mode: 'login' | 'signup') => void;
};

export function HomePage({ onSearch, onAuthClick }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src="/ChatGPT_Image_Jan_22__2026__11_25_31_PM-removebg-preview_(1).png"
            alt="MediTrack Logo"
            className="h-12 w-auto"
          />
          <span className="text-2xl font-bold text-amber-900">MediTrack</span>
        </div>

        <div className="flex gap-3">
          {user ? (
            <>
              <span className="px-4 py-2 text-amber-900">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="px-6 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onAuthClick('login')}
                className="px-6 py-2 border-2 border-amber-800 text-amber-900 rounded-lg hover:bg-amber-50 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => onAuthClick('signup')}
                className="px-6 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-amber-900 mb-4">
            MediTrack
          </h1>
          <p className="text-2xl text-amber-800 italic">
            Your medicine, Our priority
          </p>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-3xl">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for medicines..."
              className="w-full px-6 py-5 pr-14 text-lg rounded-full border-2 border-amber-300 focus:border-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-200 shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-amber-700 text-white rounded-full hover:bg-amber-800 transition-colors"
            >
              <Search className="w-6 h-6" />
            </button>
          </div>
        </form>

        <div className="mt-12 text-center text-amber-700">
          <p className="text-lg">
            Find your medicine at the nearest local pharmacy
          </p>
          <p className="text-sm mt-2">
            Search from thousands of medicines across local medical stores
          </p>
        </div>
      </main>
    </div>
  );
}
