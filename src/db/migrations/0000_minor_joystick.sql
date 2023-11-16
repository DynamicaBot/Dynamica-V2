CREATE TABLE `_prisma_migrations`  (
	`id` text PRIMARY KEY NOT NULL,
	`checksum` text NOT NULL,
	`finished_at` numeric,
	`migration_name` text NOT NULL,
	`logs` text,
	`rolled_back_at` numeric,
	`started_at` numeric DEFAULT (current_timestamp) NOT NULL,
	`applied_steps_count` numeric DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Guild` (
	`id` text PRIMARY KEY NOT NULL,
	`allowJoinRequests` numeric DEFAULT false NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Alias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity` text NOT NULL,
	`alias` text NOT NULL,
	`guildId` text NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Primary` (
	`id` text PRIMARY KEY NOT NULL,
	`creator` text NOT NULL,
	`template` text DEFAULT '@@game@@ ##' NOT NULL,
	`generalName` text DEFAULT 'General ##' NOT NULL,
	`guildId` text NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Secondary` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`creator` text,
	`emoji` text,
	`locked` numeric DEFAULT false NOT NULL,
	`guildId` text NOT NULL,
	`primaryId` text NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`lastName` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`primaryId`) REFERENCES `Primary`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Guild_id_key` ON `Guild` (`id`) ;--> statement-breakpoint
CREATE UNIQUE INDEX `Alias_guildId_activity_key` ON `Alias` (`guildId`,`activity`);--> statement-breakpoint
CREATE UNIQUE INDEX `Primary_guildId_id_key` ON `Primary` (`guildId`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Primary_id_key` ON `Primary` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Secondary_guildId_id_key` ON `Secondary` (`guildId`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Secondary_id_key` ON `Secondary` (`id`);
