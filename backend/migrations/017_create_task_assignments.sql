CREATE TABLE task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    estimated_effort_hours NUMERIC(6,2),

    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,

    CONSTRAINT task_assignments_effort_check
        CHECK (
            estimated_effort_hours IS NULL
            OR estimated_effort_hours >= 0
        ),

    CONSTRAINT task_assignments_dates_check
        CHECK (
            ended_at IS NULL
            OR ended_at >= assigned_at
        )
);

CREATE INDEX idx_task_assignments_task_id
    ON task_assignments(task_id);

CREATE INDEX idx_task_assignments_user_id
    ON task_assignments(user_id);

CREATE INDEX idx_task_assignments_assigned_by
    ON task_assignments(assigned_by);

CREATE INDEX idx_task_assignments_active
    ON task_assignments(task_id)
    WHERE ended_at IS NULL;

CREATE UNIQUE INDEX idx_task_assignments_one_active
    ON task_assignments(task_id)
    WHERE ended_at IS NULL;