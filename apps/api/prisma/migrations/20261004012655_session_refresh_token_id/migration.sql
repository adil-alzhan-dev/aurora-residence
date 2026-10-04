-- Tokens issued before this change have no session id, so every existing session is signed out.
DELETE FROM "AdminSession";

-- AlterTable
ALTER TABLE "AdminSession" ADD COLUMN     "refreshTokenId" TEXT NOT NULL;
