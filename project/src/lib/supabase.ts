import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Medicine = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  generic_name: string;
  manufacturer: string;
  created_at: string;
};

export type Pharmacy = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  place_id: string;
  created_at: string;
};

export type Inventory = {
  id: string;
  medicine_id: string;
  pharmacy_id: string;
  price: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
};

export type SearchResult = {
  pharmacy: Pharmacy;
  price: number;
  stock_quantity: number;
  distance?: number;
};
