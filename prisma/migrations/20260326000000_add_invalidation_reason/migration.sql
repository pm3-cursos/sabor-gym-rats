-- AddColumn: invalidationReason to CheckIn
ALTER TABLE "CheckIn" ADD COLUMN "invalidationReason" TEXT;

-- AddColumn: invalidationReason to FinalChallenge
ALTER TABLE "FinalChallenge" ADD COLUMN "invalidationReason" TEXT;
