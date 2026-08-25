-- Sales module tables.
-- Depends on: 002_customers.sql (orders.customer_id), 001_core_tables.sql (orders.created_by).

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    order_number VARCHAR(20) UNIQUE NOT NULL,  -- auto: ORD-2026-00001
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'confirmed', 'shipped', 'completed', 'cancelled')),
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_name VARCHAR(200) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    invoice_type VARCHAR(20) NOT NULL
        CHECK (invoice_type IN ('proforma', 'final')),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pdf_path TEXT
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_invoices_order ON invoices(order_id);
