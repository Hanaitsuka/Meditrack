/*
  # MediTrack Database Schema

  1. New Tables
    - `medicines`
      - `id` (uuid, primary key)
      - `name` (text) - Medicine name
      - `description` (text) - Medicine description
      - `image_url` (text) - URL to medicine image
      - `generic_name` (text) - Generic/scientific name
      - `manufacturer` (text) - Manufacturer name
      - `created_at` (timestamptz)
    
    - `pharmacies`
      - `id` (uuid, primary key)
      - `name` (text) - Pharmacy name
      - `address` (text) - Full address
      - `latitude` (numeric) - Latitude for mapping
      - `longitude` (numeric) - Longitude for mapping
      - `phone` (text) - Contact number
      - `created_at` (timestamptz)
    
    - `inventory`
      - `id` (uuid, primary key)
      - `medicine_id` (uuid, foreign key to medicines)
      - `pharmacy_id` (uuid, foreign key to pharmacies)
      - `price` (numeric) - Price of medicine
      - `stock_quantity` (integer) - Available quantity
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (since users need to search without login)
    - Authenticated users can read all data
*/

-- Create medicines table
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  generic_name text DEFAULT '',
  manufacturer text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create pharmacies table
CREATE TABLE IF NOT EXISTS pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  phone text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create inventory table (junction table with additional fields)
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  price numeric NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(medicine_id, pharmacy_id)
);

-- Enable RLS
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Policies for medicines (public read access)
CREATE POLICY "Anyone can view medicines"
  ON medicines FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policies for pharmacies (public read access)
CREATE POLICY "Anyone can view pharmacies"
  ON pharmacies FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policies for inventory (public read access)
CREATE POLICY "Anyone can view inventory"
  ON inventory FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_inventory_medicine_id ON inventory(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy_id ON inventory(pharmacy_id);
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text check (role in ('user', 'pharmacy')) not null default 'user',
  pharmacy_name text,
  license_number text,
  created_at timestamp with time zone default now()
);

-- Allow users to read/write only their own profile
alter table profiles enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);