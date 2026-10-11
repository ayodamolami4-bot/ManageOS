CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    actor_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    action VARCHAR(100) NOT NULL,

    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_company_id
    ON activities(company_id);

CREATE INDEX idx_activities_company_created_at
    ON activities(company_id, created_at);

CREATE INDEX idx_activities_resource
    ON activities(resource_type, resource_id);

CREATE INDEX idx_activities_actor_id
    ON activities(actor_id);