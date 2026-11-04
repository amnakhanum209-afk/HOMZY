-- CreateEnum
CREATE TYPE "VisitBookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "VisitBooking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "visitAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "status" "VisitBookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitBooking_tenantId_idx" ON "VisitBooking"("tenantId");

-- CreateIndex
CREATE INDEX "VisitBooking_propertyId_idx" ON "VisitBooking"("propertyId");

-- CreateIndex
CREATE INDEX "VisitBooking_status_idx" ON "VisitBooking"("status");

-- AddForeignKey
ALTER TABLE "VisitBooking" ADD CONSTRAINT "VisitBooking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitBooking" ADD CONSTRAINT "VisitBooking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
