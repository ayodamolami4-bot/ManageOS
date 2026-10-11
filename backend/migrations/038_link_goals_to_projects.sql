-- Goals may have several projects; projects can advance several goals.
-- Application service verifies same-company relationship before every write.
CREATE TABLE goal_project_links (
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  linked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (goal_id, project_id)
);
CREATE INDEX idx_goal_project_links_project_id ON goal_project_links(project_id);
