-- AddFingerprintTimestamps
-- Add created_at and updated_at columns to fingerprints table

ALTER TABLE "fingerprints" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fingerprints_updated_at 
    BEFORE UPDATE ON "fingerprints" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
