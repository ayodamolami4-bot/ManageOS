CREATE TABLE discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,

    title VARCHAR(255) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discussions_company_id
    ON discussions(company_id);

CREATE INDEX idx_discussions_created_by
    ON discussions(created_by);

CREATE INDEX idx_discussions_resource
    ON discussions(resource_type, resource_id);

CREATE INDEX idx_discussions_created_at
    ON discussions(company_id, created_at);