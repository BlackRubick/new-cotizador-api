-- AlterTable
ALTER TABLE `Quote` ADD COLUMN `clientAddress` VARCHAR(191) NULL,
    ADD COLUMN `clientContact` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL;
