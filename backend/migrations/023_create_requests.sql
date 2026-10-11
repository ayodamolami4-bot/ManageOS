CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_to UUID REFERENCES users(id) ON DELETE RESTRICT,

    type VARCHAR(30) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT requests_type_check
        CHECK (
            type IN (
                'APPROVAL',
                'ACCESS',
                'DECISION',
                'HELP',
                'OTHER'
            )
        ),

    CONSTRAINT requests_status_check
        CHECK (
            status IN (
                'OPEN',
                'IN_PROGRESS',
                'RESOLVED',
                'REJECTED'
            )
        )
);

CREATE INDEX idx_requests_company_id
    ON requests(company_id);

CREATE INDEX idx_requests_requested_by
    ON requests(requested_by);

CREATE INDEX idx_requests_assigned_to
    ON requests(assigned_to);

CREATE INDEX idx_requests_status
    ON requests(status);

CREATE INDEX idx_requests_created_at
    ON requests(company_id, created_at);