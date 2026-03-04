-- Add linkVisibleEarly to Live table
ALTER TABLE "Live" ADD COLUMN "linkVisibleEarly" BOOLEAN NOT NULL DEFAULT false;
