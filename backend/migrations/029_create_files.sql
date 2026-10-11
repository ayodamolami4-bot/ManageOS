CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    uploaded_by UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    resource_type VARCHAR(50) NOT NULL,

    resource_id UUID NOT NULL,

    original_name TEXT NOT NULL,

    storage_key TEXT NOT NULL UNIQUE,

    mime_type VARCHAR(150) NOT NULL,

    size_bytes BIGINT NOT NULL
        CHECK (size_bytes > 0),

    checksum_sha256 CHAR(64),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_company_created_at
    ON files(company_id, created_at);

CREATE INDEX idx_files_resource
    ON files(resource_type, resource_id);

CREATE INDEX idx_files_uploaded_by
    ON files(uploaded_by);

CREATE INDEX idx_files_company_resource
    ON files(company_id, resource_type, resource_id);