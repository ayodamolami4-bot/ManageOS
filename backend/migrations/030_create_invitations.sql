CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    email VARCHAR(255) NOT NULL,

    invited_by UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    role_id UUID NOT NULL
        REFERENCES roles(id)
        ON DELETE RESTRICT,

    organization_unit_id UUID
        REFERENCES organization_units(id)
        ON DELETE RESTRICT,

    token_hash CHAR(64) NOT NULL UNIQUE,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED')),

    expires_at TIMESTAMPTZ NOT NULL,

    accepted_user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    accepted_at TIMESTAMPTZ,

    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT invitation_email_not_empty
        CHECK (LENGTH(TRIM(email)) > 0)
);

CREATE INDEX idx_invitations_company_id
    ON invitations(company_id);

CREATE INDEX idx_invitations_email
    ON invitations(company_id, email);

CREATE INDEX idx_invitations_token_hash
    ON invitations(token_hash);

CREATE INDEX idx_invitations_status
    ON invitations(company_id, status);

CREATE INDEX idx_invitations_expires_at
    ON invitations(expires_at);

CREATE UNIQUE INDEX idx_invitations_one_pending_per_email
    ON invitations(company_id, LOWER(email))
    WHERE status = 'PENDING';