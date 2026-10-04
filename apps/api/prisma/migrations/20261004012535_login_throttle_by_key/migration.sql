-- Old email + IP counters do not map to the new keys and expire within 15 minutes anyway.
DELETE FROM "LoginThrottle";

-- AlterTable
ALTER TABLE "LoginThrottle" DROP CONSTRAINT "LoginThrottle_pkey",
DROP COLUMN "email",
DROP COLUMN "failedCount",
DROP COLUMN "ip",
DROP COLUMN "lastFailedAt",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "lastAttemptAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "LoginThrottle_pkey" PRIMARY KEY ("key");
