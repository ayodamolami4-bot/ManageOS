CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',

    due_date DATE,

    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT tasks_status_check
        CHECK (
            status IN (
                'ASSIGNED',
                'IN_PROGRESS',
                'SUBMITTED',
                'TEAM_LEAD_REVIEW',
                'APPROVED',
                'NEEDS_CHANGES',
                'COMPLETED'
            )
        ),

    CONSTRAINT tasks_priority_check
        CHECK (
            priority IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'URGENT'
            )
        )
);

CREATE INDEX idx_tasks_company_id
    ON tasks(company_id);

CREATE INDEX idx_tasks_project_id
    ON tasks(project_id);

CREATE INDEX idx_tasks_milestone_id
    ON tasks(milestone_id);

CREATE INDEX idx_tasks_created_by
    ON tasks(created_by);

CREATE INDEX idx_tasks_status
    ON tasks(company_id, status);

CREATE INDEX idx_tasks_due_date
    ON tasks(company_id, due_date);