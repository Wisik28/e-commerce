-- Seed data: Default Admin Account
-- Email   : admin@ecommerce.com
-- Password: admin123 (BCrypt hash)
INSERT INTO users (id, email, password_hash, full_name, phone, role, status, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@ecommerce.com',
    '$2a$10$OF773cnd.jasyp6br4aw6O2c9RXe.9TUtuehsgUjdBVmsa2LG3B.u',
    'Administrator',
    '000000000000',
    'ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
