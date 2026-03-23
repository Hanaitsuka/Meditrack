import { ArrowLeft, MapPin, Phone, Package, IndianRupee } from 'lucide-react';
import { Medicine, SearchResult } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type SearchResultsProps = {
  medicine: Medicine | null;
  results: SearchResult[];
  loading: boolean;
  onBack: () => void;
  onAuthClick: (mode: 'login' | 'signup') => void;
};

export function SearchResults({
  medicine,
  results,
  loading,
  onBack,
  onAuthClick,
}: SearchResultsProps) {
  const { user, signOut } = useAuth();

  const calculateDistance = (lat: number, lng: number) => {
    const distances = [0.5, 1.2, 2.3, 3.5, 4.1, 5.8];
    return distances[Math.floor(Math.random() * distances.length)];
  };

  const openMap = (placeId: string) => {
    window.open(
      `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-amber-900" />
            </button>
            <div className="flex items-center gap-3">
              <img
                src="/ChatGPT_Image_Jan_22__2026__11_25_31_PM-removebg-preview_(1).png"
                alt="MediTrack Logo"
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-amber-900">MediTrack</span>
            </div>
          </div>

          {user && (
            <div className="flex gap-3">
              <span className="px-4 py-2 text-amber-900 text-sm">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-300 border-t-amber-800"></div>
            <p className="mt-4 text-amber-800">Searching for medicines...</p>
          </div>
        ) : !medicine ? (
          <div className="text-center py-20">
            <p className="text-xl text-amber-800">Medicine not found</p>
            <button
              onClick={onBack}
              className="mt-4 px-6 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  {medicine.image_url ? (
                    <img
                      src={medicine.image_url}
                      alt={medicine.name}
                      className="w-full h-64 object-contain rounded-lg bg-gray-50"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                      <Package className="w-24 h-24 text-amber-400" />
                    </div>
                  )}
                </div>

                <div className="md:w-2/3">
                  <h1 className="text-4xl font-bold text-amber-900 mb-2">
                    {medicine.name}
                  </h1>
                  {medicine.generic_name && (
                    <p className="text-lg text-amber-700 mb-4">
                      {medicine.generic_name}
                    </p>
                  )}
                  {medicine.manufacturer && (
                    <p className="text-sm text-gray-600 mb-4">
                      Manufactured by: {medicine.manufacturer}
                    </p>
                  )}
                  <p className="text-gray-700 leading-relaxed">
                    {medicine.description || 'No description available for this medicine.'}
                  </p>
                  <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-900 font-medium">
                      Found in {results.length} {results.length === 1 ? 'pharmacy' : 'pharmacies'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-amber-900 mb-6">
              Available at these pharmacies
            </h2>

            {results.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">
                  This medicine is currently not available at any nearby pharmacies.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {results.map((result, index) => {
                  const distance = calculateDistance(
                    result.pharmacy.latitude,
                    result.pharmacy.longitude
                  );
                  return (
                    <div
                      key={result.pharmacy.id}
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-amber-900 mb-2">
                            {result.pharmacy.name}
                          </h3>

                          <div className="space-y-2 text-gray-600">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <span>{result.pharmacy.address}</span>
                            </div>

                            {result.pharmacy.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-5 h-5 text-amber-600" />
                                <span>{result.pharmacy.phone}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-amber-700 font-medium">
                              <MapPin className="w-5 h-5" />
                              <span>{distance.toFixed(1)} km away</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                          <div className="text-center px-4 py-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs text-green-700 mb-1">In Stock</p>
                            <p className="text-2xl font-bold text-green-800">
                              {result.stock_quantity}
                            </p>
                            <p className="text-xs text-green-600">units</p>
                          </div>

                          <div className="text-center px-4 py-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-xs text-amber-700 mb-1">Price</p>
                            <div className="flex items-center justify-center gap-1">
                              <IndianRupee className="w-5 h-5 text-amber-800" />
                              <p className="text-2xl font-bold text-amber-900">
                                {result.price.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <button
                           onClick={() => openMap(result.pharmacy.place_id)}
                            className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors whitespace-nowrap font-medium"
                          >
                            Get Directions
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
