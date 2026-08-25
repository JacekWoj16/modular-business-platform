-- Customers module tables.

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    tax_id VARCHAR(20),
    customer_type VARCHAR(20) NOT NULL DEFAULT 'individual'
        CHECK (customer_type IN ('individual', 'business')),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_active ON customers(is_active);
