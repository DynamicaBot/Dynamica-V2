DROP TABLE `_prisma_migrations`;--> statement-breakpoint
DROP INDEX IF EXISTS `Alias_guildId_activity_key`;--> statement-breakpoint
DROP INDEX IF EXISTS `Secondary_guildId_id_key`;--> statement-breakpoint
DROP INDEX IF EXISTS `Secondary_id_key`;--> statement-breakpoint
DROP INDEX IF EXISTS `Guild_id_key`;--> statement-breakpoint

-- Add NOT NULL to Secondary.emoji and make Secondary.locked an integer
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `new_Secondary` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`creator` text,
	`emoji` text NOT NULL,
	`locked` integer NOT NULL,
	`guildId` text NOT NULL,
	`primaryId` text NOT NULL,
    `createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`lastName` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`primaryId`) REFERENCES `Primary`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON UPDATE cascade ON DELETE cascade
);--> statement-breakpoint
INSERT INTO "new_Secondary" SELECT `id`, `name`, `creator`, `emoji`, `locked`, `guildId`, `primaryId`, `createdAt`, `updatedAt`, `lastName` FROM "Secondary";--> statement-breakpoint
DROP TABLE "Secondary";--> statement-breakpoint
ALTER TABLE "new_Secondary" RENAME TO "Secondary";--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint

-- Remove default from Guild.allowJoinRequests and change type from numeric to integer by renaming the column
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `new_Guild` (
	`id` text PRIMARY KEY NOT NULL,
	`allowJoinRequests` integer NOT NULL,
    `createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL
); --> statement-breakpoint
INSERT INTO "new_Guild" SELECT `id`, `allowJoinRequests`, `updatedAt`, `createdAt` FROM "Guild";--> statement-breakpoint
DROP TABLE "Guild";--> statement-breakpoint
ALTER TABLE "new_Guild" RENAME TO "Guild";--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint

-- Rename creator to owner in Primary
ALTER TABLE `Secondary` RENAME COLUMN `creator` TO `owner`;--> statement-breakpoint

-- Re-create unique index on Alias
CREATE UNIQUE INDEX `Alias_guildId_activity_key` ON `Alias` (`guildId`,`activity`);--> statement-breakpoint
CREATE UNIQUE INDEX `Secondary_guildId_id_key` ON `Secondary` (`guildId`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Secondary_id_key` ON `Secondary` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Guild_id_key` ON `Guild` (`id`) ;--> statement-breakpoint
-- Drop all createdAt and updatedAt columns
ALTER TABLE `Alias` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `Alias` DROP COLUMN `updatedAt`;--> statement-breakpoint
ALTER TABLE `Guild` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `Guild` DROP COLUMN `updatedAt`;--> statement-breakpoint
ALTER TABLE `Primary` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `Primary` DROP COLUMN `updatedAt`;--> statement-breakpoint
ALTER TABLE `Secondary` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `Secondary` DROP COLUMN `updatedAt`;