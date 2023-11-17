DROP TABLE `_prisma_migrations`;--> statement-breakpoint
DROP INDEX `Guild_id_key`;--> statement-breakpoint
DROP INDEX`Alias_guildId_activity_key`;--> statement-breakpoint
DROP INDEX `Primary_guildId_id_key`;--> statement-breakpoint
DROP INDEX `Primary_id_key`;--> statement-breakpoint
DROP INDEX `Secondary_guildId_id_key`;--> statement-breakpoint
DROP INDEX `Secondary_id_key`;--> statement-breakpoint

-- Add NOT NULL to Secondary.emoji and make Secondary.locked an integer
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `new_Secondary` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`owner` text,
	`emoji` text NOT NULL,
	`locked` integer NOT NULL,
	`guildId` text NOT NULL,
	`primaryId` text NOT NULL,
	`lastName` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`primaryId`) REFERENCES `Primary`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON UPDATE cascade ON DELETE cascade
);--> statement-breakpoint
INSERT INTO "new_Secondary" SELECT `id`, `name`, `creator` AS `owner`, `emoji`, `locked`, `guildId`, `primaryId`, `lastName` FROM "Secondary";--> statement-breakpoint
DROP TABLE "Secondary";--> statement-breakpoint
ALTER TABLE "new_Secondary" RENAME TO "Secondary";--> statement-breakpoint
PRAGMA foreign_key_check;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint

-- Remove default from Guild.allowJoinRequests and change type from numeric to integer by renaming the column
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `new_Guild` (
	`id` text PRIMARY KEY NOT NULL,
	`allowJoinRequests` integer NOT NULL
); --> statement-breakpoint
INSERT INTO "new_Guild" SELECT `id`, `allowJoinRequests` FROM "Guild";--> statement-breakpoint
DROP TABLE "Guild";--> statement-breakpoint
ALTER TABLE "new_Guild" RENAME TO "Guild";--> statement-breakpoint
PRAGMA foreign_key_check;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint

-- Drop updatedAt and createdAt from `Alias` by creating a new table
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `new_Alias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity` text NOT NULL,
	`alias` text NOT NULL,
	`guildId` text NOT NULL,
	FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON UPDATE cascade ON DELETE cascade
); --> statement-breakpoint
INSERT INTO "new_Alias" SELECT `id`, `activity`, `alias`, `guildId` FROM "Alias";--> statement-breakpoint
DROP TABLE "Alias";--> statement-breakpoint
ALTER TABLE "new_Alias" RENAME TO "Alias";--> statement-breakpoint
PRAGMA foreign_key_check;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint

-- Drop updatedAt and createdAt from `Primary` by creating a new table
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `new_Primary` (
	`id` text PRIMARY KEY NOT NULL,
	`creator` text NOT NULL,
	`template` text DEFAULT '@@game@@ ##' NOT NULL,
	`generalName` text DEFAULT 'General ##' NOT NULL,
	`guildId` text NOT NULL,
	FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON UPDATE cascade ON DELETE cascade
); --> statement-breakpoint
INSERT INTO "new_Primary" SELECT `id`, `creator`, `template`, `generalName`, `guildId` FROM "Primary";--> statement-breakpoint
DROP TABLE "Primary";--> statement-breakpoint
ALTER TABLE "new_Primary" RENAME TO "Primary";--> statement-breakpoint
PRAGMA foreign_key_check;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint

-- Re-create unique indexes
CREATE UNIQUE INDEX `Guild_id_key` ON `Guild` (`id`) ;--> statement-breakpoint
CREATE UNIQUE INDEX`Alias_guildId_activity_key` ON `Alias` (`guildId`,`activity`);--> statement-breakpoint
CREATE UNIQUE INDEX `Primary_guildId_id_key` ON `Primary` (`guildId`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Primary_id_key` ON `Primary` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Secondary_guildId_id_key` ON `Secondary` (`guildId`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Secondary_id_key` ON `Secondary` (`id`);