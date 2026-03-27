-- WhatsApp Sales Agent Database Schema
-- Run automatically on first Docker startup

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS leads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  phone         TEXT        UNIQUE NOT NULL,   -- E.164 format, e.g. 919876543210
  business_type TEXT,
  city          TEXT,
  address       TEXT,
  rating        NUMERIC(2,1),
  source        TEXT        DEFAULT 'apify',  -- apify | manual
  status        TEXT        DEFAULT 'pending' CHECK (status IN (
                             'pending','contacted','interested','hot','dead','converted'
                            )),
  message_sent  BOOLEAN     DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  direction   TEXT        NOT NULL CHECK (direction IN ('inbound','outbound')),
  message     TEXT        NOT NULL,
  intent      TEXT,                             -- AI classification result
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on leads
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_leads_updated_at ON leads;
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone   ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_convs_lead    ON conversations(lead_id);
