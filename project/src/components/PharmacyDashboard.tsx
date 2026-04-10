import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type InventoryItem = {
  id: string;
  medicine_name: string;
  brand: string;
  stock_quantity: number;
  price: number;
};

export function PharmacyDashboard() {
  const { user, signOut } = useAuth();
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [medicineName, setMedicineName] = useState('');
  const [brand, setBrand] = useState('');
  const [stock, setStock] = useState('');
  const [price, setPrice] = useState('');
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch pharmacy id for the logged in user
  useEffect(() => {
    const fetchPharmacyId = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setPharmacyId(data.id);
      }
    };
    fetchPharmacyId();
  }, [user]);

  // Fetch existing inventory for this pharmacy
  useEffect(() => {
    const fetchInventory = async () => {
      if (!pharmacyId) return;
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          stock_quantity,
          price,
          medicine:medicines (
            name,
            brand
          )
        `)
        .eq('pharmacy_id', pharmacyId);

      if (!error && data) {
        const items: InventoryItem[] = data.map((item: any) => ({
          id: item.id,
          medicine_name: item.medicine.name,
          brand: item.medicine.brand,
          stock_quantity: item.stock_quantity,
          price: item.price,
        }));
        setInventoryList(items);
      }
    };
    fetchInventory();
  }, [pharmacyId]);

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!pharmacyId) {
      setError('Pharmacy not found. Please contact support.');
      return;
    }

    setLoading(true);

    // Step 1: Check if medicine already exists, if not insert it
    let medicineId: string;
    const { data: existingMedicine } = await supabase
      .from('medicines')
      .select('id')
      .ilike('name', medicineName)
      .ilike('brand', brand)
      .maybeSingle();

    if (existingMedicine) {
      medicineId = existingMedicine.id;
    } else {
      const { data: newMedicine, error: medicineError } = await supabase
        .from('medicines')
        .insert({ name: medicineName, brand })
        .select('id')
        .single();

      if (medicineError || !newMedicine) {
        setError('Failed to add medicine. Try again.');
        setLoading(false);
        return;
      }
      medicineId = newMedicine.id;
    }

    // Step 2: Check if inventory entry already exists for this pharmacy + medicine
    const { data: existingInventory } = await supabase
      .from('inventory')
      .select('id, stock_quantity')
      .eq('pharmacy_id', pharmacyId)
      .eq('medicine_id', medicineId)
      .maybeSingle();

    if (existingInventory) {
      // Update stock by adding to existing quantity
      const newStock = existingInventory.stock_quantity + parseInt(stock);
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ stock_quantity: newStock, price: parseFloat(price) })
        .eq('id', existingInventory.id);

      if (updateError) {
        setError('Failed to update stock. Try again.');
        setLoading(false);
        return;
      }
      setMessage(`Stock updated! New quantity: ${newStock}`);
    } else {
      // Insert new inventory entry
      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert({
          pharmacy_id: pharmacyId,
          medicine_id: medicineId,
          stock_quantity: parseInt(stock),
          price: parseFloat(price),
        });

      if (inventoryError) {
        setError('Failed to add inventory. Try again.');
        setLoading(false);
        return;
      }
      setMessage('Medicine added successfully!');
    }

    // Refresh inventory list
    const { data: updatedInventory } = await supabase
      .from('inventory')
      .select(`
        id,
        stock_quantity,
        price,
        medicine:medicines (
          name,
          brand
        )
      `)
      .eq('pharmacy_id', pharmacyId);

    if (updatedInventory) {
      setInventoryList(updatedInventory.map((item: any) => ({
        id: item.id,
        medicine_name: item.medicine.name,
        brand: item.medicine.brand,
        stock_quantity: item.stock_quantity,
        price: item.price,
      })));
    }

    // Reset form
    setMedicineName('');
    setBrand('');
    setStock('');
    setPrice('');
    setLoading(false);
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
          <h1 className="text-xl font-bold">Pharmacy Dashboard</h1>
        </div>
        <button
          onClick={signOut}
          className="bg-amber-800 hover:bg-amber-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">

        {/* Add Medicine Form */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-amber-900 mb-6">Add / Update Medicine Stock</h2>
          <form onSubmit={handleAddMedicine} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
              <input
                type="text"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="e.g. Paracetamol"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="e.g. Crocin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="e.g. 100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="e.g. 49.99"
              />
            </div>

            {error && (
              <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="md:col-span-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {message}
              </div>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Saving...' : 'Add / Update Stock'}
              </button>
            </div>
          </form>
        </div>

        {/* Current Inventory Table */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-amber-900 mb-4">Current Inventory</h2>
          {inventoryList.length === 0 ? (
            <p className="text-gray-500 text-sm">No medicines added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="pb-3 pr-4">Medicine</th>
                    <th className="pb-3 pr-4">Brand</th>
                    <th className="pb-3 pr-4">Stock</th>
                    <th className="pb-3">Price (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryList.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-amber-50">
                      <td className="py-3 pr-4 font-medium text-gray-800">{item.medicine_name}</td>
                      <td className="py-3 pr-4 text-gray-600">{item.brand}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.stock_quantity > 10
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.stock_quantity} units
                        </span>
                      </td>
                      <td className="py-3 text-gray-800">₹{item.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}