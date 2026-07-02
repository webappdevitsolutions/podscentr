-- Extend order and payment statuses for online/COD checkout.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'Confirmed';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'Processing';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'Paid';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'COD_PENDING';

-- Store customer contact and shipping address directly on each order snapshot.
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "customerEmail" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "addressLine1" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "addressLine2" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "city" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "state" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "pinCode" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS "fullAddress" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "paymentGateway" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'Pending';

-- Store gateway-specific payment identifiers and raw status for auditability.
ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "gateway" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "cfOrderId" TEXT,
  ADD COLUMN IF NOT EXISTS "rawStatus" TEXT NOT NULL DEFAULT '';
