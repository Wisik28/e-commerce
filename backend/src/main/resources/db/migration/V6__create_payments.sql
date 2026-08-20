CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('VIRTUAL_ACCOUNT', 'MANUAL')),
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'PROOF_SUBMITTED', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED')),
    amount NUMERIC(19,2) NOT NULL CHECK (amount >= 0),
    provider VARCHAR(50),
    external_reference VARCHAR(150) UNIQUE,
    virtual_account_number VARCHAR(100),
    expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    review_status VARCHAR(20) NOT NULL CHECK (review_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    review_note TEXT
);
