-- Inventory module tables.
-- Depends on: 001_core_tables.sql (stock_movements.created_by).

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit VARCHAR(10) NOT NULL DEFAULT 'pcs'
        CHECK (unit IN ('pcs', 'kg', 'm', 'l', 'set')),
    current_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
    min_stock_level NUMERIC(10,2) NOT NULL DEFAULT 0,
    price NUMERIC(10,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    movement_type VARCHAR(20) NOT NULL
        CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity NUMERIC(10,2) NOT NULL,
    reference TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_stock ON products(current_stock);
CREATE INDEX idx_movements_product ON stock_movements(product_id);
CREATE INDEX idx_movements_created ON stock_movements(created_at);
