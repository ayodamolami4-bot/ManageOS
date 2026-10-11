INSERT INTO roles (company_id, name, description, is_system)
VALUES
    (NULL, 'OWNER', 'Full control over the company', TRUE),
    (NULL, 'MANAGER', 'Manages work and people within assigned scope', TRUE),
    (NULL, 'TEAM_LEAD', 'Leads a team and reviews assigned work', TRUE),
    (NULL, 'EMPLOYEE', 'Performs assigned work and submits progress', TRUE);