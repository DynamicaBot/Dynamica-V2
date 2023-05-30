import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { sql } from 'kysely';

import { Alias } from '@/db/types';
import { MqttService } from '@/features/mqtt';
import UpdateMode from '@/utils/UpdateMode';

import { KyselyService } from '../kysely';
import { PubSubService } from '../pubsub';

@Injectable()
export class AliasService {
  constructor(
    private readonly kysely: KyselyService,
    private readonly mqtt: MqttService,
    private readonly pubSub: PubSubService,
  ) {}

  /**
   * Upsert an alias for an activity
   * @param guildId Guild Id
   * @param activity Activity name to alias
   * @param alias Alias to use
   * @returns Created or updated alias
   */
  public async upsertAlias(guildId: string, activity: string, alias: string) {
    // const upsertedAlias = await this.db.alias.upsert({
    //   where: {
    //     guildId_activity: {
    //       guildId,
    //       activity,
    //     },
    //   },
    //   update: {
    //     alias,
    //   },
    //   create: {
    //     guildId,
    //     activity,
    //     alias,
    //   },
    // });

    // rewrite prisma alias upsert to kysely

    const upsertedAlias = await this.kysely
      .insertInto('Alias')
      .values({
        guildId,
        activity,
        alias,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .onConflict((oc) =>
        oc.columns(['activity', 'guildId']).doUpdateSet((eb) => ({
          alias: eb.ref('excluded.alias'),
          guildId: eb.ref('excluded.guildId'),
          updatedAt: eb.ref('excluded.updatedAt'),
        })),
      )
      .returningAll()
      .executeTakeFirst();

    this.pubSub.publish('aliasUpdate', {
      aliasUpdate: {
        data: upsertedAlias,
        mode: UpdateMode.Update,
      },
    });

    const { aliasCount } = await this.kysely
      .selectFrom('Alias')
      .select((eb) => eb.fn.countAll<number>().as('aliasCount'))
      .executeTakeFirst();

    await this.mqtt.publish(`dynamica/aliases`, aliasCount);

    return upsertedAlias;
  }

  /**
   * Delete an alias for an activity
   * @param guildId Guild Id
   * @param activity Activity name to alias
   * @returns Deleted alias
   */
  public async deleteAlias(guildId: string, activity: string) {
    const existingAlias = await this.kysely
      .selectFrom('Alias')
      .where('guildId', '=', guildId)
      .where('activity', '=', activity)
      .selectAll()
      .executeTakeFirst();

    if (!existingAlias) {
      throw new Error('Alias does not exist');
    }

    const deletedAlias = await this.kysely
      .deleteFrom('Alias')
      .where('guildId', '=', guildId)
      .where('activity', '=', activity)
      .returningAll()
      .executeTakeFirst();

    this.pubSub.publish('aliasUpdate', {
      aliasUpdate: {
        data: deletedAlias,
        mode: UpdateMode.Delete,
      },
    });

    const { aliasCount } = await this.kysely
      .selectFrom('Alias')
      .select((eb) => eb.fn.countAll<number>().as('aliasCount'))
      .executeTakeFirst();

    await this.mqtt.publish(`dynamica/aliases`, aliasCount);

    return deletedAlias;
  }

  /**
   * List all aliases for a guild
   * @param guildId Guild Id
   * @returns List of aliases for a guild
   */
  public async listAliases(guildId: string) {
    const aliases = await this.kysely
      .selectFrom('Alias')
      .where('guildId', '=', guildId)
      .selectAll()
      .execute();

    return aliases;
  }
}
