import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

import { MqttService } from '@/features/mqtt';
import { PrismaService } from '@/features/prisma';
import UpdateMode from '@/utils/UpdateMode';

import { PubSubService } from '../pubsub';

@Injectable()
export class AliasService {
  constructor(
    private readonly db: PrismaService,
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
    const upsertedAlias = await this.db.alias.upsert({
      where: {
        guildId_activity: {
          guildId,
          activity,
        },
      },
      update: {
        alias,
      },
      create: {
        guildId,
        activity,
        alias,
      },
    });

    this.pubSub.publish('aliasUpdate', {
      aliasUpdate: {
        data: upsertedAlias,
        mode: UpdateMode.Update,
      },
    });

    const aliasCount = await this.db.alias.count();

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
    const existingAlias = await this.db.alias.findUnique({
      where: {
        guildId_activity: {
          guildId,
          activity,
        },
      },
    });

    if (!existingAlias) {
      throw new Error('Alias does not exist');
    }

    const deletedAlias = await this.db.alias.delete({
      where: {
        guildId_activity: {
          guildId,
          activity,
        },
      },
    });

    this.pubSub.publish('aliasUpdate', {
      aliasUpdate: {
        data: deletedAlias,
        mode: UpdateMode.Delete,
      },
    });

    const aliasCount = await this.db.alias.count();

    await this.mqtt.publish(`dynamica/aliases`, aliasCount);

    return deletedAlias;
  }

  /**
   * List all aliases for a guild
   * @param guildId Guild Id
   * @returns List of aliases for a guild
   */
  public async listAliases(guildId: string) {
    const aliases = await this.db.alias.findMany({
      where: {
        guildId,
      },
    });

    return aliases;
  }
}
