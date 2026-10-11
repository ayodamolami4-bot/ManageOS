CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    due_date DATE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT milestones_status_check
        CHECK (status IN (
            'PLANNED',
            'IN_PROGRESS',
            'COMPLETED'
        ))
);

CREATE INDEX idx_milestones_project_id
    ON milestones(project_id);

CREATE INDEX idx_milestones_created_by
    ON milestones(created_by);

CREATE INDEX idx_milestones_status
    ON milestones(project_id, status);

CREATE INDEX idx_milestones_due_date
    ON milestones(project_id, due_date);