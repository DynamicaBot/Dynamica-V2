ALTER TABLE `Secondary` RENAME TO `Secondary_old`;
--> statement-breakpoint

CREATE TABLE `Secondary` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`creator` text NOT NULL,
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
FROM `Secondary_old` WHERE `creator` IS NOT NULL;
--> statement-breakpoint

DROP TABLE `Secondary_old`;
