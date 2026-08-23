-- Add missing weight_gram column to products table if not present
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_gram INTEGER DEFAULT 1000;
