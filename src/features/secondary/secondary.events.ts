import { Injectable } from '@nestjs/common';
import { ActivityType } from 'discord.js';
import { Context, type ContextOf, On } from 'necord';

import { MqttService } from '@/features/mqtt';
import { PrismaService } from '@/features/prisma';
import { getPresence } from '@/utils/presence';
import UpdateMode from '@/utils/UpdateMode';

import { KyselyService } from '../kysely';
import { PubSubService } from '../pubsub';

import { SecondaryService } from './secondary.service';

@Injectable()
export class SecondaryEvents {
  constructor(
    private readonly kysely: KyselyService,
    private readonly secondaryService: SecondaryService,
    private readonly mqtt: MqttService,
    private readonly pubSub: PubSubService,
  ) {}

  @On('voiceStateUpdate')
  public async onVoiceStateUpdate(
    @Context() [oldVoiceState, newVoiceState]: ContextOf<'voiceStateUpdate'>,
  ) {
    if (!oldVoiceState.channelId && !newVoiceState.channelId) {
      return;
    }

    if (oldVoiceState.channelId === newVoiceState.channelId) {
      return;
    }

    const oldSecondary = oldVoiceState.channelId
      ? await this.kysely
          .selectFrom('Secondary')
          .where('id', '=', oldVoiceState.channelId)
          .selectAll()
          .executeTakeFirst()
      : undefined;

    if (oldSecondary) {
      // Left a secondary channel
      const channelId = oldSecondary.id;
      await this.secondaryService.update(oldSecondary.guildId, channelId);
    }

    const newSecondary = newVoiceState.channelId
      ? await this.kysely
          .selectFrom('Secondary')
          .where('id', '=', newVoiceState.channelId)
          .selectAll()
          .executeTakeFirst()
      : undefined;

    const oldPrimary = oldVoiceState.channelId
      ? await this.kysely
          .selectFrom('Primary')
          .where('id', '=', oldVoiceState.channelId)
          .selectAll()
          .executeTakeFirst()
      : undefined;

    if (newSecondary && newSecondary.primaryId !== oldPrimary?.id) {
      // Joined a secondary channel but not from it's primary (prevents double counting) on create
      const channelId = newSecondary.id;
      await this.secondaryService.update(newSecondary.guildId, channelId);
    }

    const newPrimary = newVoiceState.channelId
      ? await this.kysely
          .selectFrom('Primary')
          .where('id', '=', newVoiceState.channelId)
          .selectAll()
          .executeTakeFirst()
      : undefined;

    if (newPrimary) {
      // Joined a primary channel
      const channelId = newPrimary.id;
      await this.secondaryService.create(
        newVoiceState.guild.id,
        channelId,
        newVoiceState.member.id,
      );
    }
  }

  @On('channelDelete')
  public async onChannelDelete(
    @Context() [channel]: ContextOf<'channelDelete'>,
  ) {
    if (channel.isDMBased()) return;

    const databaseChannel = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channel.id)
      .selectAll()
      .executeTakeFirst();

    if (!databaseChannel) return;

    const deletedSecondary = await this.kysely
      .deleteFrom('Secondary')
      .where('id', '=', channel.id)
      .returningAll()
      .executeTakeFirst();

    const { secondaryCount } = await this.kysely
      .selectFrom('Secondary')
      .select((cb) => cb.fn.countAll<number>().as('secondaryCount'))
      .executeTakeFirst();
    const { primaryCount } = await this.kysely
      .selectFrom('Primary')
      .select((cb) => cb.fn.countAll<number>().as('primaryCount'))
      .executeTakeFirst();

    this.pubSub.publish('secondaryUpdate', {
      secondaryUpdate: {
        mode: UpdateMode.Delete,
        data: deletedSecondary,
      },
    });

    channel.client.user.setPresence(getPresence(primaryCount + secondaryCount));

    this.mqtt.publish(`dynamica/secondaries`, secondaryCount);
  }

  @On('presenceUpdate')
  public async onPresenceUpdate(
    @Context() [oldPresence, newPresence]: ContextOf<'presenceUpdate'>,
  ) {
    const channelId = newPresence?.member?.voice?.channelId;

    if (!channelId) return;

    const databaseSecondary = await this.kysely
      .selectFrom('Secondary')
      .where('id', '=', channelId)
      .selectAll()
      .executeTakeFirst();

    if (!databaseSecondary) return;

    const oldPresenceActivity = oldPresence?.activities ?? [];

    const oldActivities = oldPresenceActivity.filter(
      (activity) =>
        activity.type === ActivityType.Playing ||
        activity.type === ActivityType.Competing,
    );

    const oldActivityList = [
      ...new Set(oldActivities.map((activity) => activity.name)),
    ].sort();

    const newActivities = (newPresence.activities ?? []).filter(
      (activity) =>
        activity.type === ActivityType.Playing ||
        activity.type === ActivityType.Competing,
    );

    const newActivityList = [
      ...new Set(newActivities.map((activity) => activity.name)),
    ].sort();

    const isSameActivities =
      JSON.stringify(oldActivityList) === JSON.stringify(newActivityList);

    if (isSameActivities) return;

    this.secondaryService.updateName(newPresence.guild.id, channelId);
  }
}
