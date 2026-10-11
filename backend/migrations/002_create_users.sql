CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES companies(id),

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,

    phone VARCHAR(30),
    country VARCHAR(100),
    timezone VARCHAR(100),
    job_title VARCHAR(150),
    avatar_url TEXT,

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_company_email_unique
        UNIQUE (company_id, email)
);

CREATE INDEX idx_users_company_id
    ON users(company_id);