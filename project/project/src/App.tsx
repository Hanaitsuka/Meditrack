import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './components/HomePage';
import { SearchResults } from './components/SearchResults';
import { AuthModal } from './components/AuthModal';
import { PharmacyDashboard } from './components/PharmacyDashboard';
import { useAuth } from './contexts/AuthContext';
import { supabase, Medicine, SearchResult } from './lib/supabase';

type View = 'home' | 'results';

function AppContent() {
  const { user, role } = useAuth();
  const [view, setView] = useState<View>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // If logged in as pharmacy, show dashboard
  if (user && role === 'pharmacy') {
    return <PharmacyDashboard />;
  }

  const handleSearch = async (query: string) => {
    setLoading(true);
    setView('results');

    try {
      const { data: medicineData, error: medicineError } = await supabase
        .from('medicines')
        .select('*')
        .ilike('name', `%${query}%`)
        .maybeSingle();

      if (medicineError) throw medicineError;

      if (!medicineData) {
        setMedicine(null);
        setSearchResults([]);
        setLoading(false);
        return;
      }

      setMedicine(medicineData);

      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          price,
          stock_quantity,
          pharmacy:pharmacies (
            id,
            name,
            address,
            latitude,
            longitude,
            phone,
            place_id,
            created_at
          )
        `)
        .eq('medicine_id', medicineData.id)
        .gt('stock_quantity', 0)
        .order('price', { ascending: true });

      if (inventoryError) throw inventoryError;

      const results: SearchResult[] = (inventoryData || []).map((item: any) => ({
        pharmacy: item.pharmacy,
        price: item.price,
        stock_quantity: item.stock_quantity,
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setMedicine(null);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleBack = () => {
    setView('home');
    setMedicine(null);
    setSearchResults([]);
  };

  return (
    <>
      {view === 'home' ? (
        <HomePage onSearch={handleSearch} onAuthClick={handleAuthClick} />
      ) : (
        <SearchResults
          medicine={medicine}
          results={searchResults}
          loading={loading}
          onBack={handleBack}
          onAuthClick={handleAuthClick}
        />
      )}
      {authModalOpen && (
        <AuthModal
          mode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;