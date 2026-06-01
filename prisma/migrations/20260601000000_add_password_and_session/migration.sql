-- Add password field to User (nullable — existing users without a password
-- continue to sign in via the legacy email-only flow for backward compatibility).
ALTER TABLE "User" ADD COLUMN "password" TEXT;

-- Add sessionId to Photo for grouping multi-photo upload batches.
ALTER TABLE "Photo" ADD COLUMN "sessionId" TEXT;
CREATE INDEX "Photo_sessionId_idx" ON "Photo"("sessionId");
