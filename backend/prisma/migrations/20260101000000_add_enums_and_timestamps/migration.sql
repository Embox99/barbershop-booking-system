-- Create enums
CREATE TYPE "Role" AS ENUM ('client', 'barber', 'admin');
CREATE TYPE "AppointmentStatus" AS ENUM ('pending', 'confirmed', 'cancelled');

-- Migrate User.role from String to enum
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'client'::"Role";

-- Migrate Appointment.status from String to enum
ALTER TABLE "Appointment" ALTER COLUMN "status" TYPE "AppointmentStatus" USING "status"::"AppointmentStatus";
ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'pending'::"AppointmentStatus";

-- Add createdAt columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
