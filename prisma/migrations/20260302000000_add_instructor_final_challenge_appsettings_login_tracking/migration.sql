-- Add login tracking fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginCount"       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastAccessDate"   TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "welcomeDismissed" BOOLEAN NOT NULL DEFAULT false;

-- Update showFirstNameOnly default to true for new users
-- (existing users keep their current value)
ALTER TABLE "User" ALTER COLUMN "showFirstNameOnly" SET DEFAULT true;

-- Add instructor field to Live
ALTER TABLE "Live" ADD COLUMN IF NOT EXISTS "instructor" TEXT;

-- Create FinalChallenge table
CREATE TABLE IF NOT EXISTS "FinalChallenge" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "challengeUrl" TEXT NOT NULL,
    "submittedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "points"       INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "FinalChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FinalChallenge_userId_key" ON "FinalChallenge"("userId");

ALTER TABLE "FinalChallenge"
    ADD CONSTRAINT "FinalChallenge_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create AppSettings table
CREATE TABLE IF NOT EXISTS "AppSettings" (
    "key"   TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("key")
);

-- Add FINAL_CHALLENGE_SUBMITTED to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FINAL_CHALLENGE_SUBMITTED';
