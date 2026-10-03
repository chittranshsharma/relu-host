-- ==============================================================================
-- Relu Consultancy - Data Extraction Engineer Hiring Challenge
-- Supabase Schema: Data Persistence & Extraction Pipeline
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- Table 1: disney_cruises (Challenge Objective 1)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disney_cruises (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    ship TEXT NOT NULL,
    departing_from TEXT NOT NULL,
    destination TEXT NOT NULL,
    duration TEXT NOT NULL,
    nights INTEGER NOT NULL DEFAULT 1,
    itinerary TEXT NOT NULL,
    date_range TEXT NOT NULL,
    weekday_range TEXT,
    interior_price NUMERIC(10, 2),
    oceanview_price NUMERIC(10, 2),
    balcony_price NUMERIC(10, 2),
    suite_price NUMERIC(10, 2),
    available_dates_count INTEGER NOT NULL DEFAULT 1,
    is_holiday_cruise BOOLEAN NOT NULL DEFAULT FALSE,
    holiday_theme TEXT DEFAULT 'None',
    booking_url TEXT,
    bonuses TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast filtering & challenge question queries
CREATE INDEX IF NOT EXISTS idx_disney_destination ON public.disney_cruises (destination);
CREATE INDEX IF NOT EXISTS idx_disney_departing_from ON public.disney_cruises (departing_from);
CREATE INDEX IF NOT EXISTS idx_disney_holiday ON public.disney_cruises (is_holiday_cruise);
CREATE INDEX IF NOT EXISTS idx_disney_dates_count ON public.disney_cruises (available_dates_count);

-- Enable Row Level Security (RLS)
ALTER TABLE public.disney_cruises ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access
CREATE POLICY "Allow public read access on disney_cruises" 
    ON public.disney_cruises 
    FOR SELECT 
    USING (true);

-- Allow Anonymous/Authenticated Insert & Update for Demo / Sync
CREATE POLICY "Allow public insert on disney_cruises" 
    ON public.disney_cruises 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public update on disney_cruises" 
    ON public.disney_cruises 
    FOR UPDATE 
    USING (true);

-- ------------------------------------------------------------------------------
-- Table 2: ingredients_network (Challenge Objective 2)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ingredients_network (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_description TEXT NOT NULL,
    sales_markets TEXT NOT NULL,
    primary_business_activity TEXT NOT NULL,
    categories TEXT NOT NULL,
    events TEXT,
    address TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    website TEXT,
    has_herbs_and_spices BOOLEAN NOT NULL DEFAULT FALSE,
    has_physical_delivery_formats BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_formats TEXT,
    in_cognitive_mental_health BOOLEAN NOT NULL DEFAULT FALSE,
    health_wellness_focus TEXT,
    ingredients_count INTEGER NOT NULL DEFAULT 0,
    finished_products_count INTEGER NOT NULL DEFAULT 0,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for challenge question queries
CREATE INDEX IF NOT EXISTS idx_ing_herbs_spices ON public.ingredients_network (has_herbs_and_spices);
CREATE INDEX IF NOT EXISTS idx_ing_delivery_formats ON public.ingredients_network (has_physical_delivery_formats);
CREATE INDEX IF NOT EXISTS idx_ing_cognitive_health ON public.ingredients_network (in_cognitive_mental_health);
CREATE INDEX IF NOT EXISTS idx_ing_company_name ON public.ingredients_network (company_name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ingredients_network ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access
CREATE POLICY "Allow public read access on ingredients_network" 
    ON public.ingredients_network 
    FOR SELECT 
    USING (true);

-- Allow Anonymous/Authenticated Insert & Update for Demo / Sync
CREATE POLICY "Allow public insert on ingredients_network" 
    ON public.ingredients_network 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public update on ingredients_network" 
    ON public.ingredients_network 
    FOR UPDATE 
    USING (true);

-- ------------------------------------------------------------------------------
-- Helper Views for Challenge Questions
-- ------------------------------------------------------------------------------

-- Challenge Objective 1 Metrics View
CREATE OR REPLACE VIEW public.v_disney_challenge_metrics AS
SELECT 
    COUNT(*) AS total_cruises,
    COUNT(*) FILTER (WHERE destination ILIKE '%Pacific%') AS pacific_destination_count,
    COUNT(*) FILTER (WHERE is_holiday_cruise = TRUE) AS holiday_cruises_count,
    COUNT(*) FILTER (WHERE available_dates_count > 2) AS more_than_2_dates_count,
    COUNT(*) FILTER (WHERE departing_from ILIKE '%Miami%' OR departing_from ILIKE '%London%' OR departing_from ILIKE '%Southampton%') AS miami_london_departure_count
FROM public.disney_cruises;

-- Challenge Objective 2 Metrics View
CREATE OR REPLACE VIEW public.v_ingredients_challenge_metrics AS
SELECT 
    COALESCE(SUM(ingredients_count), 0) AS total_ingredients_count,
    COALESCE(SUM(finished_products_count), 0) AS total_finished_products_count,
    COUNT(*) FILTER (WHERE has_herbs_and_spices = TRUE) AS companies_with_herbs_spices_count,
    COUNT(*) FILTER (WHERE has_physical_delivery_formats = TRUE) AS companies_with_delivery_formats_count,
    COUNT(*) FILTER (WHERE in_cognitive_mental_health = TRUE) AS companies_in_cognitive_mental_health_count
FROM public.ingredients_network;
