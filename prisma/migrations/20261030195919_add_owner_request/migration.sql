-- CreateEnum
CREATE TYPE "OwnerRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "OwnerRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OwnerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnerRequest_userId_key" ON "OwnerRequest"("userId");

-- AddForeignKey
ALTER TABLE "OwnerRequest" ADD CONSTRAINT "OwnerRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
