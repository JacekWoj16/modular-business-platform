-- Core platform tables: users, per-user module toggles, panel layout, settings.

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enabled modules per user
CREATE TABLE user_modules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    module_id VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    enabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- Panel layout persistence
CREATE TABLE user_layouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    panel_id VARCHAR(100) NOT NULL,          -- e.g., 'sales.orders'
    pos_x INTEGER NOT NULL DEFAULT 0,
    pos_y INTEGER NOT NULL DEFAULT 0,
    width INTEGER NOT NULL DEFAULT 2,
    height INTEGER NOT NULL DEFAULT 2,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    color VARCHAR(7) DEFAULT '#2563eb',      -- Panel header color
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, panel_id)
);

-- App settings
CREATE TABLE settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL
);
