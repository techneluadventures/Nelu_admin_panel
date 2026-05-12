-- 1. HARDENED LEADS TABLE
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS phone_hash TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS location_lat FLOAT8,
ADD COLUMN IF NOT EXISTS location_lng FLOAT8,
ADD COLUMN IF NOT EXISTS location_label TEXT,
ADD COLUMN IF NOT EXISTS property_type TEXT CHECK (property_type IN ('Resort', 'Farmstay', 'Campsite', 'Hotel', 'School', 'Corporate')),
ADD COLUMN IF NOT EXISTS property_area TEXT,
ADD COLUMN IF NOT EXISTS activities_interest TEXT[],
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS import_batch_id UUID,
ADD COLUMN IF NOT EXISTS loss_reason TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- 2. ADVANCED SITE VISITS TABLE
ALTER TABLE site_visits
ADD COLUMN IF NOT EXISTS gps_accuracy_m FLOAT4,
ADD COLUMN IF NOT EXISTS gps_captured_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS items_discussed TEXT[],
ADD COLUMN IF NOT EXISTS client_objections TEXT[],
ADD COLUMN IF NOT EXISTS photo_urls TEXT[],
ADD COLUMN IF NOT EXISTS next_action TEXT,
ADD COLUMN IF NOT EXISTS follow_up_date DATE,
ADD COLUMN IF NOT EXISTS synced_offline BOOLEAN DEFAULT false;

-- 3. LEAD CONTACTS (Communication Logging)
CREATE TABLE IF NOT EXISTS lead_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    agent_id UUID REFERENCES users(id),
    contact_type TEXT CHECK (contact_type IN ('call', 'whatsapp', 'email', 'in_person')),
    outcome TEXT,
    notes TEXT,
    contacted_at TIMESTAMPTZ DEFAULT now()
);

-- 4. QUOTATIONS SYSTEM
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    line_items JSONB,
    discount_pct FLOAT4 DEFAULT 0,
    grand_total NUMERIC,
    valid_until DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    pdf_url TEXT,
    sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'revised', 'expired'))
);

-- 5. PROJECTS MODULE (The Execution Engine)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code TEXT UNIQUE,
    lead_id UUID REFERENCES leads(id),
    quotation_id UUID REFERENCES quotations(id),
    client_name TEXT,
    property_name TEXT,
    project_manager_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'design' CHECK (status IN ('design', 'contracted', 'procurement', 'installation', 'safety_audit', 'training', 'handed_over', 'remediation')),
    start_date DATE,
    target_completion DATE,
    actual_completion DATE,
    activities TEXT[],
    contract_value NUMERIC,
    amc_purchased BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SAFETY AUDITS (Immutable Blocks)
CREATE TABLE IF NOT EXISTS safety_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    auditor_id UUID REFERENCES users(id),
    audit_date DATE DEFAULT CURRENT_DATE,
    checklist_results JSONB,
    critical_failures INTEGER DEFAULT 0,
    overall_result TEXT CHECK (overall_result IN ('pass', 'fail', 'conditional_pass')),
    certificate_url TEXT,
    signed_at TIMESTAMPTZ
);

-- 7. CLIENT FEEDBACK & AMC
CREATE TABLE IF NOT EXISTS client_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    rating_installation INT2,
    rating_professionalism INT2,
    rating_timeline INT2,
    rating_safety INT2,
    rating_overall INT2,
    nps_score INT2,
    what_worked TEXT,
    what_to_improve TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    type TEXT CHECK (type IN ('amc', 'complaint', 'repair')),
    severity TEXT CHECK (severity IN ('critical', 'moderate', 'minor')),
    status TEXT DEFAULT 'open',
    assigned_to UUID REFERENCES users(id),
    scheduled_date DATE,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    client_confirmed BOOLEAN DEFAULT false,
    sla_breach BOOLEAN DEFAULT false
);
