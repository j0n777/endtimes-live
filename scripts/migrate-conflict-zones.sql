-- ============================================================
--  EndTimes Monitor — Conflict Zones + Nuclear Alerts tables
--  Run this ONCE in the Supabase dashboard SQL editor.
-- ============================================================

-- ── Conflict Zones ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conflict_zones (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL DEFAULT 'WAR',
                    -- WAR | CIVIL_WAR | INVASION | CRISIS | STANDOFF | INSURGENCY
    severity        TEXT NOT NULL DEFAULT 'HIGH',
                    -- LOW | MEDIUM | HIGH | CRITICAL
    center_lat      DOUBLE PRECISION NOT NULL,
    center_lng      DOUBLE PRECISION NOT NULL,
    radius_km       DOUBLE PRECISION NOT NULL DEFAULT 300,
    color           TEXT NOT NULL DEFAULT '#dc2626',
    belligerents    TEXT[] DEFAULT '{}',
    description     TEXT,
    start_date      DATE,
    casualties_estimate   TEXT,
    displaced_estimate    TEXT,
    key_developments      TEXT[] DEFAULT '{}',
    is_active       BOOLEAN DEFAULT true,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conflict_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read conflict_zones" ON conflict_zones;
CREATE POLICY "Public read conflict_zones"
    ON conflict_zones FOR SELECT USING (true);

-- ── Nuclear Alerts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nuclear_alerts (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title            TEXT NOT NULL,
    lat              DOUBLE PRECISION NOT NULL,
    lng              DOUBLE PRECISION NOT NULL,
    yield_kt         DOUBLE PRECISION NOT NULL,    -- kilotons
    weapon_name      TEXT,
    attacker         TEXT,
    defender         TEXT,
    target_city      TEXT,
    target_country   TEXT,
    detonation_time  TIMESTAMPTZ,
    verified         BOOLEAN DEFAULT false,
    ai_assessment    JSONB,                        -- AI-generated JSON report
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nuclear_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read nuclear_alerts" ON nuclear_alerts;
CREATE POLICY "Public read nuclear_alerts"
    ON nuclear_alerts FOR SELECT USING (true);
