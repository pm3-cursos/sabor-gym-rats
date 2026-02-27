-- Add isBanned to User (idempotent)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false;

-- Add isInvalid and updatedAt to CheckIn (idempotent)
ALTER TABLE "CheckIn" ADD COLUMN IF NOT EXISTS "isInvalid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CheckIn" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
UPDATE "CheckIn" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Create PointAdjustment table (idempotent)
CREATE TABLE IF NOT EXISTS "PointAdjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PointAdjustment_pkey" PRIMARY KEY ("id")
);

-- Create Reaction table (idempotent)
CREATE TABLE IF NOT EXISTS "Reaction" (
    "id" TEXT NOT NULL,
    "checkInId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys (idempotent via DO blocks)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'PointAdjustment_userId_fkey'
    ) THEN
        ALTER TABLE "PointAdjustment"
            ADD CONSTRAINT "PointAdjustment_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Reaction_checkInId_fkey'
    ) THEN
        ALTER TABLE "Reaction"
            ADD CONSTRAINT "Reaction_checkInId_fkey"
            FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Reaction_userId_fkey'
    ) THEN
        ALTER TABLE "Reaction"
            ADD CONSTRAINT "Reaction_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add unique constraint on Reaction (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Reaction_checkInId_userId_key'
    ) THEN
        ALTER TABLE "Reaction"
            ADD CONSTRAINT "Reaction_checkInId_userId_key"
            UNIQUE ("checkInId", "userId");
    END IF;
END $$;
