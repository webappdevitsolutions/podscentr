-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Collection" ADD COLUMN "isAutomatic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Collection" ADD COLUMN "rules" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "AnalyticsEvent" ADD COLUMN "collectionId" TEXT;

-- CreateIndex
CREATE INDEX "AnalyticsEvent_collectionId_idx" ON "AnalyticsEvent"("collectionId");
