-- AddColumn: isInvalid to FinalChallenge
ALTER TABLE "FinalChallenge" ADD COLUMN "isInvalid" BOOLEAN NOT NULL DEFAULT false;
