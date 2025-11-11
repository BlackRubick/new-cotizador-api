-- AlterTable
ALTER TABLE `Client` ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `contrato` VARCHAR(191) NULL,
    ADD COLUMN `dependencia` VARCHAR(191) NULL,
    ADD COLUMN `empresaResponsable` VARCHAR(191) NULL,
    ADD COLUMN `hospital` VARCHAR(191) NULL,
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `zipCode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Equipment` ADD COLUMN `fechaInstalacion` VARCHAR(191) NULL,
    ADD COLUMN `ultimoMantenimiento` VARCHAR(191) NULL;
