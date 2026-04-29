ALTER TABLE "ClientProfile"
ADD COLUMN IF NOT EXISTS "document_number" TEXT;

CREATE INDEX IF NOT EXISTS "ClientProfile_document_number_idx"
ON "ClientProfile" ("document_number");
