PRAGMA foreign_keys=OFF;
--> statement-breakpoint
DROP TABLE IF EXISTS `_prisma_migrations`;
--> statement-breakpoint
CREATE TABLE `new_Secondary` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`creator` text,
	`emoji` text,
	`locked` integer DEFAULT false NOT NULL,
	`guildId` text NOT NULL,
	`primaryId` text NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`lastName` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`primaryId`) REFERENCES `Primary`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `new_Secondary` (
    `id`,
    `name`,
    `creator`,
    `emoji`,
    `locked`,
    `guildId`,
    `primaryId`,
    `createdAt`,
    `updatedAt`,
    `lastName`
) SELECT
    `id`,
    `name`,
    `creator`,
    `emoji`,
    `locked`,
    `guildId`,
    `primaryId`,
    `createdAt`,
    `updatedAt`,
    `lastName`
FROM `Secondary`;
--> statement-breakpoint
DROP TABLE `Secondary`;
--> statement-breakpoint
ALTER TABLE `new_Secondary` RENAME TO `Secondary`;
--> statement-breakpoint
ALTER TABLE `Guild` RENAME TO `Guild_old`;
--> statement-breakpoint
CREATE TABLE `Guild` (
	`id` text PRIMARY KEY NOT NULL,
	`allowJoinRequests` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `Guild` (
    `id`,
    `allowJoinRequests`,
    `createdAt`,
    `updatedAt`
) SELECT
    `id`,
    `allowJoinRequests`,
    `createdAt`,
    `updatedAt`
FROM `Guild_old`;
--> statement-breakpoint
DROP TABLE `Guild_old`;
--> statement-breakpoint
CREATE TABLE `new_Primary` (
	`id` text PRIMARY KEY NOT NULL,
	`creator` text NOT NULL,
	`template` text DEFAULT '@@game@@ ##' NOT NULL,
	`generalName` text DEFAULT 'General ##' NOT NULL,
	`guildId` text NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `new_Primary` (
    `id`,
    `creator`,
    `template`,
    `generalName`,
    `guildId`,
    `createdAt`,
    `updatedAt`
) SELECT
    `id`,
    `creator`,
    `template`,
    `generalName`,
    `guildId`,
    `createdAt`,
    `updatedAt`
FROM `Primary`;
--> statement-breakpoint
DROP TABLE `Primary`;
--> statement-breakpoint
ALTER TABLE `new_Primary` RENAME TO `Primary`;
--> statement-breakpoint
ALTER TABLE `Alias` RENAME TO `Alias_old`;
--> statement-breakpoint
CREATE TABLE `Alias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity` text NOT NULL,
	`alias` text NOT NULL,
	`guildId` text NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `Alias` (
    `id`,
    `activity`,
    `alias`,
    `guildId`,
    `createdAt`,
    `updatedAt`
) SELECT
    `id`,
    `activity`,
    `alias`,
    `guildId`,
    `createdAt`,
    `updatedAt`
FROM `Alias_old`;
--> statement-breakpoint
DROP TABLE `Alias_old`;
--> statement-breakpoint
PRAGMA foreign_key_check;
--> statement-breakpoint
PRAGMA foreign_keys=ON;