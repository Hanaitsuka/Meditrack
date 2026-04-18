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

  // For inline editing of existing inventory
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');

  useEffect(() => {
    const fetchPharmacyId = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!error && data) setPharmacyId(data.id);
    };
    fetchPharmacyId();
  }, [user]);

  const fetchInventory = async (pharmId: string) => {
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
      .eq('pharmacy_id', pharmId);

    if (!error && data) {
      setInventoryList(data.map((item: any) => ({
        id: item.id,
        medicine_name: item.medicine.name,
        brand: item.medicine.brand ?? '',
        stock_quantity: item.stock_quantity,
        price: item.price,
      })));
    }
  };

  useEffect(() => {
    if (pharmacyId) fetchInventory(pharmacyId);
  }, [pharmacyId]);

  // Add new medicine to inventory
  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!pharmacyId) { setError('Pharmacy not found. Please contact support.'); return; }
    setLoading(true);

    // Check if medicine exists
    let medicineId: string;
    const { data: existingMedicine } = await supabase
      .from('medicines')
      .select('id')
      .ilike('name', medicineName)
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

    // Check if inventory entry already exists
    const { data: existingInventory } = await supabase
      .from('inventory')
      .select('id, stock_quantity')
      .eq('pharmacy_id', pharmacyId)
      .eq('medicine_id', medicineId)
      .maybeSingle();

    if (existingInventory) {
      const newStock = existingInventory.stock_quantity + parseInt(stock);
      await supabase
        .from('inventory')
        .update({ stock_quantity: newStock, price: parseFloat(price) })
        .eq('id', existingInventory.id);
      setMessage(`Stock updated! New quantity: ${newStock}`);
    } else {
      await supabase.from('inventory').insert({
        pharmacy_id: pharmacyId,
        medicine_id: medicineId,
        stock_quantity: parseInt(stock),
        price: parseFloat(price),
      });
      setMessage('Medicine added successfully!');
    }

    setMedicineName('');
    setBrand('');
    setStock('');
    setPrice('');
    setLoading(false);
    fetchInventory(pharmacyId);
  };

  // Add stock to existing inventory item
  const handleAddStock = async (item: InventoryItem) => {
    const amount = parseInt(adjustAmount);
    if (!amount || amount <= 0) return;
    const newStock = item.stock_quantity + amount;
    const { error } = await supabase
      .from('inventory')
      .update({ stock_quantity: newStock })
      .eq('id', item.id);
    if (!error) {
      setMessage(`Added ${amount} units to ${item.medicine_name}. New stock: ${newStock}`);
      setAdjustAmount('');
      setEditingId(null);
      fetchInventory(pharmacyId!);
    }
  };

  // Remove stock from existing inventory item
  const handleRemoveStock = async (item: InventoryItem) => {
    const amount = parseInt(adjustAmount);
    if (!amount || amount <= 0) return;
    if (amount > item.stock_quantity) {
      setError(`Cannot remove ${amount} units. Only ${item.stock_quantity} in stock.`);
      return;
    }
    const newStock = item.stock_quantity - amount;
    const { error } = await supabase
      .from('inventory')
      .update({ stock_quantity: newStock })
      .eq('id', item.id);
    if (!error) {
      setMessage(`Removed ${amount} units from ${item.medicine_name}. New stock: ${newStock}`);
      setAdjustAmount('');
      setEditingId(null);
      fetchInventory(pharmacyId!);
    }
  };

  // Update price of existing inventory item
  const handleUpdatePrice = async (item: InventoryItem) => {
    const newPrice = parseFloat(editPrice);
    if (!newPrice || newPrice <= 0) return;
    const { error } = await supabase
      .from('inventory')
      .update({ price: newPrice })
      .eq('id', item.id);
    if (!error) {
      setMessage(`Price updated for ${item.medicine_name} to ₹${newPrice.toFixed(2)}`);
      setEditPrice('');
      setEditingId(null);
      fetchInventory(pharmacyId!);
    }
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

        {/* Add New Medicine */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-amber-900 mb-6">Add New Medicine</h2>
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
                {loading ? 'Saving...' : 'Add Medicine'}
              </button>
            </div>
          </form>
        </div>

        {/* Current Inventory */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-amber-900 mb-4">Current Inventory</h2>
          {inventoryList.length === 0 ? (
            <p className="text-gray-500 text-sm">No medicines added yet.</p>
          ) : (
            <div className="space-y-4">
              {inventoryList.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-xl p-4">
                  {/* Medicine Info */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.medicine_name}</h3>
                      <p className="text-sm text-gray-500">{item.brand}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.stock_quantity > 10
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.stock_quantity} units
                      </span>
                      <p className="text-sm text-gray-600 mt-1">₹{item.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {editingId !== item.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingId(item.id); setAdjustAmount(''); setEditPrice(''); setError(''); setMessage(''); }}
                        className="flex-1 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                      >
                        Update Stock / Price
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-2">
                      {/* Stock Adjustment */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Adjust Stock (enter amount)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            min="1"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="e.g. 50"
                          />
                          <button
                            onClick={() => handleAddStock(item)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            + Add
                          </button>
                          <button
                            onClick={() => handleRemoveStock(item)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                          >
                            − Remove
                          </button>
                        </div>
                      </div>

                      {/* Price Update */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Update Price (₹)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            min="0"
                            step="0.01"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder={`Current: ₹${item.price.toFixed(2)}`}
                          />
                          <button
                            onClick={() => handleUpdatePrice(item)}
                            className="px-4 py-2 bg-amber-700 text-white rounded-lg text-sm font-medium hover:bg-amber-800 transition-colors"
                          >
                            Update
                          </button>
                        </div>
                      </div>

                      {error && (
                        <p className="text-red-600 text-xs">{error}</p>
                      )}
                      {message && (
                        <p className="text-green-600 text-xs">{message}</p>
                      )}

                      <button
                        onClick={() => { setEditingId(null); setError(''); setMessage(''); }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}