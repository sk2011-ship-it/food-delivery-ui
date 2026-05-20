-- Widen fcm_token column from varchar(255) to text so it can store a
-- JSON array of tokens (one per device) instead of a single token.
ALTER TABLE "users" ALTER COLUMN "fcm_token" TYPE TEXT;
