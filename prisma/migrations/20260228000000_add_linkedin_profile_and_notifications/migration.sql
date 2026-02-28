-- Add linkedinProfileUrl to User (idempotent)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "linkedinProfileUrl" TEXT;

-- Create NotificationType enum (idempotent)
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM (
        'REACTION', 'SCORE_ADJUSTMENT', 'CHECKIN_REMOVED', 'RANK_CHANGE', 'CLASS_REMINDER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create Notification table (idempotent)
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Add foreign key (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Notification_userId_fkey'
    ) THEN
        ALTER TABLE "Notification"
            ADD CONSTRAINT "Notification_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
