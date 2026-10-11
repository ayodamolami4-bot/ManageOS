CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',

    start_date DATE,
    due_date DATE,

    created_by UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT projects_status_check
        CHECK (status IN (
            'PLANNED',
            'ACTIVE',
            'ON_HOLD',
            'COMPLETED',
            'CANCELLED'
        )),

    CONSTRAINT projects_priority_check
        CHECK (priority IN (
            'LOW',
            'MEDIUM',
            'HIGH',
            'URGENT'
        )),

    CONSTRAINT projects_date_check
        CHECK (
            due_date IS NULL
            OR start_date IS NULL
            OR due_date >= start_date
        )
);

CREATE INDEX idx_projects_company_id
    ON projects(company_id);

CREATE INDEX idx_projects_created_by
    ON projects(created_by);

CREATE INDEX idx_projects_status
    ON projects(company_id, status);

CREATE INDEX idx_projects_due_date
    ON projects(company_id, due_date);