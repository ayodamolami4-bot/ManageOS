CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    content TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_discussion_id
    ON comments(discussion_id);

CREATE INDEX idx_comments_author_id
    ON comments(author_id);

CREATE INDEX idx_comments_created_at
    ON comments(discussion_id, created_at);