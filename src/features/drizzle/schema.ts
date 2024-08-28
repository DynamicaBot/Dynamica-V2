import { relations } from "drizzle-orm";
import {
	boolean,
	foreignKey,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const migratedTable = pgTable("Migrated", {
	id: serial("id").notNull().primaryKey(),
	createdAt: timestamp("createdAt", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const guildTable = pgTable("Guild", {
	id: text("id").notNull().primaryKey(),
	allowJoinRequests: boolean("allowJoinRequests").notNull().default(false),
	createdAt: timestamp("createdAt", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const primaryTable = pgTable(
	"Primary",
	{
		id: text("id").notNull().primaryKey(),
		creator: text("creator").notNull(),
		template: text("template").notNull().default("@@game@@ ##"),
		generalName: text("generalName").notNull().default("General ##"),
		guildId: text("guildId")
			.notNull()
			.references(() => guildTable.id),
		createdAt: timestamp("createdAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updatedAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(primaryTable) => ({
		Primary_guild_fkey: foreignKey({
			name: "Primary_guild_fkey",
			columns: [primaryTable.guildId],
			foreignColumns: [guildTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		Primary_guildId_id_unique_idx: uniqueIndex("Primary_guildId_id_key").on(
			primaryTable.guildId,
			primaryTable.id,
		),
	}),
);

export const secondaryTable = pgTable(
	"Secondary",
	{
		id: text("id").notNull().primaryKey(),
		name: text("name"),
		creator: text("creator"),
		emoji: text("emoji"),
		locked: boolean("locked").notNull().default(false),
		guildId: text("guildId")
			.notNull()
			.references(() => guildTable.id),
		primaryId: text("primaryId")
			.notNull()
			.references(() => primaryTable.id),
		createdAt: timestamp("createdAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updatedAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
		lastName: text("lastName").notNull(),
	},
	(secondaryTable) => ({
		Secondary_guild_fkey: foreignKey({
			name: "Secondary_guild_fkey",
			columns: [secondaryTable.guildId],
			foreignColumns: [guildTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		Secondary_primary_fkey: foreignKey({
			name: "Secondary_primary_fkey",
			columns: [secondaryTable.primaryId],
			foreignColumns: [primaryTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		Secondary_guildId_id_unique_idx: uniqueIndex("Secondary_guildId_id_key").on(
			secondaryTable.guildId,
			secondaryTable.id,
		),
	}),
);

export const aliasTable = pgTable(
	"Alias",
	{
		id: serial("id").notNull().primaryKey(),
		activity: text("activity").notNull(),
		alias: text("alias").notNull(),
		guildId: text("guildId")
			.notNull()
			.references(() => guildTable.id),
		createdAt: timestamp("createdAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updatedAt", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(aliasTable) => ({
		Alias_guild_fkey: foreignKey({
			name: "Alias_guild_fkey",
			columns: [aliasTable.guildId],
			foreignColumns: [guildTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		Alias_guildId_activity_unique_idx: uniqueIndex(
			"Alias_guildId_activity_key",
		).on(aliasTable.guildId, aliasTable.activity),
	}),
);

export const guildTableRelations = relations(guildTable, ({ many }) => ({
	primaryChannels: many(primaryTable, {
		relationName: "GuildToPrimary",
	}),
	secondaryChannels: many(primaryTable, {
		relationName: "GuildToSecondary",
	}),
	aliases: many(aliasTable, {
		relationName: "AliasOnGuild",
	}),
}));

export const primaryTableRelations = relations(
	primaryTable,
	({ many, one }) => ({
		secondaries: many(secondaryTable, {
			relationName: "SecondaryOnPrimary",
		}),
		guild: one(guildTable, {
			relationName: "GuildToPrimary",
			fields: [primaryTable.guildId],
			references: [guildTable.id],
		}),
	}),
);

export const secondaryTableRelations = relations(secondaryTable, ({ one }) => ({
	guild: one(guildTable, {
		relationName: "GuildToSecondary",
		fields: [secondaryTable.guildId],
		references: [guildTable.id],
	}),
	primary: one(primaryTable, {
		relationName: "SecondaryOnPrimary",
		fields: [secondaryTable.primaryId],
		references: [primaryTable.id],
	}),
}));

export const aliasTableRelations = relations(aliasTable, ({ one }) => ({
	guild: one(guildTable, {
		relationName: "AliasOnGuild",
		fields: [aliasTable.guildId],
		references: [guildTable.id],
	}),
}));
