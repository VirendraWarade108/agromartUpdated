-- CreateTable
CREATE TABLE "OrderTracking" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "OrderTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderTracking_orderId_idx" ON "OrderTracking"("orderId");

-- CreateIndex
CREATE INDEX "OrderTracking_status_idx" ON "OrderTracking"("status");

-- AddForeignKey
ALTER TABLE "OrderTracking" ADD CONSTRAINT "OrderTracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
