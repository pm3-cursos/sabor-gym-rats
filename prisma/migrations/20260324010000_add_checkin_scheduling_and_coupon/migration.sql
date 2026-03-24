-- AddColumn: checkInOpenAt and checkInDisabled to Live
ALTER TABLE "Live" ADD COLUMN "checkInOpenAt" TIMESTAMP(3);
ALTER TABLE "Live" ADD COLUMN "checkInDisabled" BOOLEAN NOT NULL DEFAULT false;
