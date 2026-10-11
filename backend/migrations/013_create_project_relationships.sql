CREATE TABLE project_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES projects(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_leads_project_id
    ON project_leads(project_id);

CREATE INDEX idx_project_leads_user_id
    ON project_leads(user_id);


CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES projects(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_members_project_id
    ON project_members(project_id);

CREATE INDEX idx_project_members_user_id
    ON project_members(user_id);


CREATE TABLE project_organization_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES projects(id)
        ON DELETE CASCADE,

    organization_unit_id UUID NOT NULL
        REFERENCES organization_units(id)
        ON DELETE CASCADE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (project_id, organization_unit_id)
);

CREATE INDEX idx_project_organization_units_project_id
    ON project_organization_units(project_id);

CREATE INDEX idx_project_organization_units_organization_unit_id
    ON project_organization_units(organization_unit_id);