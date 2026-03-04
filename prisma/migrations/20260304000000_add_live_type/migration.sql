-- Create LiveType enum
DO $$ BEGIN
    CREATE TYPE "LiveType" AS ENUM ('LIVE', 'ASYNC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add liveType column to Live with default ASYNC
ALTER TABLE "Live" ADD COLUMN IF NOT EXISTS "liveType" "LiveType" NOT NULL DEFAULT 'ASYNC';
