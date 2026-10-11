CREATE TABLE task_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
    reviewed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    decision VARCHAR(30) NOT NULL,
    comment TEXT,
    reviewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT task_reviews_decision_check
        CHECK (decision IN ('APPROVED', 'NEEDS_CHANGES'))
);

CREATE INDEX idx_task_reviews_submission_id
    ON task_reviews(submission_id);

CREATE INDEX idx_task_reviews_reviewed_by
    ON task_reviews(reviewed_by);

CREATE INDEX idx_task_reviews_reviewed_at
    ON task_reviews(submission_id, reviewed_at);