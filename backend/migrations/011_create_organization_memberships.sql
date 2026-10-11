CREATE TABLE organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    organization_unit_id UUID NOT NULL
        REFERENCES organization_units(id)
        ON DELETE CASCADE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, organization_unit_id)
);

CREATE INDEX idx_organization_memberships_user_id
    ON organization_memberships(user_id);

CREATE INDEX idx_organization_memberships_organization_unit_id
    ON organization_memberships(organization_unit_id);