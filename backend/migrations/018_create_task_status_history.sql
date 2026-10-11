CREATE TABLE task_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,

    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT task_status_history_previous_status_check
        CHECK (
            previous_status IS NULL
            OR previous_status IN (
                'ASSIGNED',
                'IN_PROGRESS',
                'SUBMITTED',
                'TEAM_LEAD_REVIEW',
                'APPROVED',
                'NEEDS_CHANGES',
                'COMPLETED'
            )
        ),

    CONSTRAINT task_status_history_new_status_check
        CHECK (
            new_status IN (
                'ASSIGNED',
                'IN_PROGRESS',
                'SUBMITTED',
                'TEAM_LEAD_REVIEW',
                'APPROVED',
                'NEEDS_CHANGES',
                'COMPLETED'
            )
        )
);

CREATE INDEX idx_task_status_history_task_id
    ON task_status_history(task_id);

CREATE INDEX idx_task_status_history_changed_by
    ON task_status_history(changed_by);

CREATE INDEX idx_task_status_history_created_at
    ON task_status_history(task_id, created_at);