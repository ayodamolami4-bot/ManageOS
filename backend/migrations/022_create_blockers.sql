CREATE TABLE blockers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',

    resolved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    resolved_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT blockers_status_check
        CHECK (status IN ('OPEN', 'RESOLVED')),

    CONSTRAINT blockers_resolution_check
        CHECK (
            (status = 'OPEN' AND resolved_by IS NULL AND resolved_at IS NULL)
            OR
            (status = 'RESOLVED' AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL)
        )
);

CREATE INDEX idx_blockers_task_id
    ON blockers(task_id);

CREATE INDEX idx_blockers_reported_by
    ON blockers(reported_by);

CREATE INDEX idx_blockers_status
    ON blockers(status);

CREATE INDEX idx_blockers_created_at
    ON blockers(task_id, created_at);