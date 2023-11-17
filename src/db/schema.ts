import { relations } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  uniqueIndex,
  integer,
} from 'drizzle-orm/sqlite-core';
import emojiList from 'emoji-random-list';

export const guild = sqliteTable(
  'Guild',
  {
    id: text('id').primaryKey().notNull(),
    allowJoinRequests: integer('allowJoinRequests', {
      mode: 'boolean',
    }).notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex('Guild_id_key').on(table.id),
    };
  },
);

export const guildRelations = relations(guild, ({ many }) => ({
  primaries: many(primary),
  secondaries: many(secondary),
  aliases: many(alias),
}));

export const alias = sqliteTable(
  'Alias',
  {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    activity: text('activity').notNull(),
    alias: text('alias').notNull(),
    guildId: text('guildId')
      .notNull()
      .references(() => guild.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      guildIdActivityKey: uniqueIndex('Alias_guildId_activity_key').on(
        table.guildId,
        table.activity,
      ),
    };
  },
);

export const aliasRelations = relations(alias, ({ one }) => ({
  guild: one(guild, {
    fields: [alias.guildId],
    references: [guild.id],
  }),
}));

export const primary = sqliteTable(
  'Primary',
  {
    id: text('id').primaryKey().notNull(),
    creator: text('creator').notNull(),
    template: text('template').default('@@game@@ ##').notNull(),
    generalName: text('generalName').default('General ##').notNull(),
    guildId: text('guildId')
      .notNull()
      .references(() => guild.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      guildIdIdKey: uniqueIndex('Primary_guildId_id_key').on(
        table.guildId,
        table.id,
      ),
      idKey: uniqueIndex('Primary_id_key').on(table.id),
    };
  },
);

export const primaryRelations = relations(primary, ({ one, many }) => ({
  guild: one(guild, {
    fields: [primary.guildId],
    references: [guild.id],
  }),
  secondaries: many(secondary),
}));

export const secondary = sqliteTable(
  'Secondary',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name'),
    owner: text('owner').notNull(),
    emoji: text('emoji')
      .notNull()
      .$defaultFn(() => {
        const emoji: string = emojiList.random({
          skintones: false,
          genders: false,
          group: 'smileys-and-emotion,animals-and-nature,food-and-drink',
        })[0];

        return emoji;
      }),
    locked: integer('locked', { mode: 'boolean' }).notNull().default(false),
    guildId: text('guildId')
      .notNull()
      .references(() => guild.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    primaryId: text('primaryId')
      .notNull()
      .references(() => primary.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    lastName: text('lastName').default('').notNull(),
  },
  (table) => {
    return {
      guildIdIdKey: uniqueIndex('Secondary_guildId_id_key').on(
        table.guildId,
        table.id,
      ),
      idKey: uniqueIndex('Secondary_id_key').on(table.id),
    };
  },
);

export const secondaryRelations = relations(secondary, ({ one }) => ({
  guild: one(guild, {
    fields: [secondary.guildId],
    references: [guild.id],
  }),
  primary: one(primary, {
    fields: [secondary.primaryId],
    references: [primary.id],
  }),
}));
