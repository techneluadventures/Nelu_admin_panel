-- Nelu Adventures CRM & OS Schema

-- 1. Leads Table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resort_name TEXT,
    client_name TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    location TEXT,
    gps_coordinates TEXT,
    source TEXT, -- Instagram, WhatsApp, Cold call, Walk-in, Referral, Website
    category TEXT, -- Resort, School, College, Farmhouse, Commercial, Hotel, Personal, Campsite, Corporate, Other
    
    -- Qualification
    interest_level TEXT, -- Hot, Warm, Cold
    budget_range TEXT, -- Low, Medium, High
    timeline TEXT, -- Immediate, 1-3 Months, Later
    decision_maker BOOLEAN,
    
    -- Pipeline State
    stage TEXT DEFAULT 'New Lead', -- New Lead, Contacted, Site Visit Scheduled, Site Visit Completed, Qualified, Proposal Draft, Proposal Sent, Negotiation, Won, Lost, Post-Sale
    
    -- Follow-up
    next_followup_date TIMESTAMP WITH TIME ZONE,
    followup_type TEXT, -- Call, Visit, WhatsApp, Email, Waiting
    last_interaction_notes TEXT,
    
    -- Ownership
    assigned_to UUID REFERENCES public.users(id),
    created_by UUID REFERENCES public.users(id),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Site Visits Table (Immutable)
CREATE TABLE public.site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id),
    employee_id UUID REFERENCES public.users(id),
    
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    gps_location TEXT NOT NULL, -- GPS is mandatory
    
    discussion_summary TEXT,
    products_discussed TEXT[],
    interest_level TEXT,
    
    next_followup_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    -- No updated_at because logs are immutable
);

-- 3. Site Visit Media
CREATE TABLE public.site_visit_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES public.site_visits(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    media_type TEXT, -- 'photo' or 'video'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Quotations
CREATE TABLE public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id),
    created_by UUID REFERENCES public.users(id),
    
    products JSONB NOT NULL, -- Array of { name, quantity, price }
    subtotal NUMERIC,
    installation_charges NUMERIC,
    gst_amount NUMERIC,
    grand_total NUMERIC,
    
    payment_terms TEXT,
    timeline_weeks INTEGER,
    status TEXT DEFAULT 'Draft', -- Draft, Sent, Negotiation, Approved, Rejected
    pdf_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Projects (Installations)
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id),
    quotation_id UUID REFERENCES public.quotations(id),
    
    status TEXT DEFAULT 'Not Started', -- Not Started, In Progress, Completed
    start_date DATE,
    expected_completion DATE,
    
    assigned_team UUID[], -- Array of user IDs
    
    client_satisfaction TEXT,
    testimonial_collected BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Follow-up Logs (To track history of follow-ups)
CREATE TABLE public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id),
    employee_id UUID REFERENCES public.users(id),
    
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type TEXT, -- Call, Visit, WhatsApp, Email
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
