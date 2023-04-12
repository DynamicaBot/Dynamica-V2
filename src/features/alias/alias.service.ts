import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/features/prisma';

import { MixpanelService } from '../mixpanel';
import { SecondaryService } from '../secondary/secondary.service';

@Injectable()
export class AliasService {
  constructor(
    private readonly db: PrismaService,
    private readonly secondaryService: SecondaryService,
    private readonly mixpanel: MixpanelService,
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

    await this.mixpanel.track('Alias Command Run', {
      distinct_id: guildId,
      activity,
      activityAlias: alias,
    });

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

    await this.mixpanel.track('Unalias Command Run', {
      distinct_id: guildId,
      activity,
    });

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

    await this.mixpanel.track('Aliases Command Run', {
      distinct_id: guildId,
    });

    return aliases;
  }
}
