CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID
        REFERENCES companies(id),

    name VARCHAR(100) NOT NULL,

    description TEXT,

    is_system BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT roles_company_name_unique
        UNIQUE (company_id, name)
);

CREATE INDEX idx_roles_company_id
    ON roles(company_id);