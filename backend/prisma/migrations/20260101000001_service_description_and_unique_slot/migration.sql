-- Add description to Service
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Unique constraint on non-cancelled appointments (partial index)
-- The @@unique in Prisma creates a regular unique index; we drop it
-- and replace with a partial index that excludes cancelled appointments.
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_barberId_dateTime_active_key"
  ON "Appointment" ("barberId", "dateTime")
  WHERE status != 'cancelled';
