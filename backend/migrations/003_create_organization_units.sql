CREATE TABLE organization_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES companies(id),

    parent_unit_id UUID
        REFERENCES organization_units(id),

    name VARCHAR(150) NOT NULL,

    type VARCHAR(50) NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT organization_unit_name_unique
        UNIQUE (company_id, name)
);

CREATE INDEX idx_organization_units_company_id
    ON organization_units(company_id);

CREATE INDEX idx_organization_units_parent_unit_id
    ON organization_units(parent_unit_id);