CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    progress_percentage INTEGER NOT NULL,
    content TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT reports_progress_percentage_check
        CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

CREATE INDEX idx_reports_task_id
    ON reports(task_id);

CREATE INDEX idx_reports_created_by
    ON reports(created_by);

CREATE INDEX idx_reports_created_at
    ON reports(task_id, created_at);