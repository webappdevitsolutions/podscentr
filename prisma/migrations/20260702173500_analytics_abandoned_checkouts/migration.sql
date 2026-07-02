CREATE TYPE "AbandonedCheckoutStatus" AS ENUM ('STARTED', 'ABANDONED', 'RECOVERED', 'CONVERTED');

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "path" TEXT NOT NULL DEFAULT '',
  "referrer" TEXT NOT NULL DEFAULT '',
  "source" TEXT NOT NULL DEFAULT '',
  "medium" TEXT NOT NULL DEFAULT '',
  "campaign" TEXT NOT NULL DEFAULT '',
  "productId" TEXT,
  "cartId" TEXT,
  "orderId" TEXT,
  "userAgent" TEXT NOT NULL DEFAULT '',
  "device" TEXT NOT NULL DEFAULT 'unknown',
  "browser" TEXT NOT NULL DEFAULT 'unknown',
  "os" TEXT NOT NULL DEFAULT 'unknown',
  "country" TEXT NOT NULL DEFAULT '',
  "region" TEXT NOT NULL DEFAULT '',
  "ipHash" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AbandonedCheckout" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL DEFAULT '',
  "customerPhone" TEXT NOT NULL DEFAULT '',
  "customerName" TEXT NOT NULL DEFAULT '',
  "items" JSONB NOT NULL,
  "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "AbandonedCheckoutStatus" NOT NULL DEFAULT 'STARTED',
  "checkoutStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActivityAt" TIMESTAMP(3) NOT NULL,
  "convertedOrderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AbandonedCheckout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");
CREATE INDEX "AnalyticsEvent_productId_idx" ON "AnalyticsEvent"("productId");
CREATE INDEX "AnalyticsEvent_orderId_idx" ON "AnalyticsEvent"("orderId");
CREATE INDEX "AnalyticsEvent_path_idx" ON "AnalyticsEvent"("path");
CREATE UNIQUE INDEX "AbandonedCheckout_sessionId_cartId_key" ON "AbandonedCheckout"("sessionId", "cartId");
CREATE INDEX "AbandonedCheckout_status_lastActivityAt_idx" ON "AbandonedCheckout"("status", "lastActivityAt");
CREATE INDEX "AbandonedCheckout_convertedOrderId_idx" ON "AbandonedCheckout"("convertedOrderId");
