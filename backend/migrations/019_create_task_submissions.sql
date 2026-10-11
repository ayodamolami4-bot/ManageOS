CREATE TABLE task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    description TEXT,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_submissions_task_id
    ON task_submissions(task_id);

CREATE INDEX idx_task_submissions_submitted_by
    ON task_submissions(submitted_by);

CREATE INDEX idx_task_submissions_submitted_at
    ON task_submissions(task_id, submitted_at);
    