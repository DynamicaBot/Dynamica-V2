PRAGMA foreign_keys=OFF;
--> statement-breakpoint
ALTER TABLE `Secondary` RENAME TO `Secondary_old`;
--> statement-breakpoint
CREATE TABLE `Secondary` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`creator` text NOT NULL,
	`emoji` text NOT NULL,
	`locked` integer DEFAULT false NOT NULL,
	`guildId` text NOT NULL,
	`primaryId` text NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`lastName` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
INSERT INTO `Secondary` (
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
FROM `Secondary_old` 
WHERE `emoji` IS NOT NULL;
--> statement-breakpoint
DROP TABLE `Secondary_old`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
