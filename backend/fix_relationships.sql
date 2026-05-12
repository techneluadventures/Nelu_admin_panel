-- FORCE RELATIONSHIP FOR SITE VISITS
ALTER TABLE site_visits 
DROP COLUMN IF EXISTS employee_id; -- Cleanup old column if exists

ALTER TABLE site_visits
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES users(id);

-- Ensure the relationship is indexed for speed
CREATE INDEX IF NOT EXISTS idx_site_visits_agent_id ON site_visits(agent_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_lead_id ON site_visits(lead_id);
