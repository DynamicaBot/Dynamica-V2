import type { ColumnType, GeneratedAlways } from 'kysely';
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Alias = {
  id: Generated<number>;
  activity: string;
  alias: string;
  guildId: string;
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
};
export type Guild = {
  id: string;
  allowJoinRequests: Generated<number>;
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
};
export type Primary = {
  id: string;
  creator: string;
  template: Generated<string>;
  generalName: Generated<string>;
  guildId: string;
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
};
export type Secondary = {
  id: string;
  name: string | null;
  creator: string | null;
  emoji: string | null;
  locked: Generated<number>;
  guildId: string;
  primaryId: string;
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
  lastName: Generated<string>;
};
export type DB = {
  Alias: Alias;
  Guild: Guild;
  Primary: Primary;
  Secondary: Secondary;
};
