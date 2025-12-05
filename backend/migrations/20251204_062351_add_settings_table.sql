-- Migration: Add Settings Table
CREATE TABLE IF NOT EXISTS "Settings" (
    "id" UUID PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "responseTone" TEXT DEFAULT 'professional',
    "kbConnectorUrl" TEXT,
    "kbConnectorApiKey" TEXT,
    "kbConnectorActive" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
