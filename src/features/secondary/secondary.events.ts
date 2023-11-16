import { Inject, Injectable } from '@nestjs/common';
import { ActivityType } from 'discord.js';
import { eq, sql } from 'drizzle-orm';
import { Context, type ContextOf, On } from 'necord';

import { primary, secondary } from '@/db/schema';
import { MqttService } from '@/features/mqtt';
import { getPresence } from '@/utils/presence';

import { DRIZZLE_TOKEN, type Drizzle } from '../drizzle/drizzle.module';

import { IntentsError, SecondaryService } from './secondary.service';

@Injectable()
export class SecondaryEvents {
  constructor(
    @Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
    private readonly secondaryService: SecondaryService,
    private readonly mqtt: MqttService,
  ) {}

  private async isChannelSecondary(channelId?: string | null): Promise<
    | {
        id: string;
        guildId: string;
        primaryId: string;
      }
    | undefined
  > {
    if (!channelId) return undefined;

    const [databaseSecondary] = await this.db
      .select({
        id: secondary.id,
        guildId: secondary.guildId,
        primaryId: secondary.primaryId,
      })
      .from(secondary)
      .where(eq(secondary.id, channelId));

    return databaseSecondary;
  }

  private async isChannelPrimary(channelId?: string | null): Promise<
    | {
        id: string;
        guildId: string;
      }
    | undefined
  > {
    if (!channelId) return undefined;

    const [databasePrimary] = await this.db
      .select({ id: primary.id, guildId: primary.guildId })
      .from(primary)
      .where(eq(primary.id, channelId));

    return databasePrimary;
  }

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

    const oldSecondary = await this.isChannelSecondary(oldVoiceState.channelId);

    if (oldSecondary) {
      // Left a secondary channel
      const channelId = oldSecondary.id;
      await this.secondaryService.update(oldSecondary.guildId, channelId);
    }

    const newSecondary = await this.isChannelSecondary(newVoiceState.channelId);

    const oldPrimary = await this.isChannelPrimary(oldVoiceState.channelId);

    if (newSecondary && newSecondary.primaryId !== oldPrimary?.id) {
      // Joined a secondary channel but not from it's primary (prevents double counting) on create
      const channelId = newSecondary.id;
      await this.secondaryService.update(newSecondary.guildId, channelId);
    }

    const newPrimary = await this.isChannelPrimary(newVoiceState.channelId);

    if (newPrimary) {
      // Joined a primary channel
      const channelId = newPrimary.id;

      const newStateMember = newVoiceState.member;

      if (!newStateMember) throw new IntentsError('Guild member');

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

    const databaseChannel = await this.isChannelSecondary(channel.id);

    if (!databaseChannel) return;

    await this.db.delete(secondary).where(eq(secondary.id, channel.id));

    const [{ secondaryCount }] = await this.db
      .select({
        secondaryCount: sql<number>`COUNT(*)`,
      })
      .from(secondary);
    const [{ primaryCount }] = await this.db
      .select({
        primaryCount: sql<number>`COUNT(*)`,
      })
      .from(primary);

    channel.client.user.setPresence(getPresence(primaryCount + secondaryCount));

    this.mqtt.publish(`dynamica/secondaries`, secondaryCount);
  }

  @On('presenceUpdate')
  public async onPresenceUpdate(
    @Context() [oldPresence, newPresence]: ContextOf<'presenceUpdate'>,
  ) {
    const channelId = newPresence?.member?.voice?.channelId;
    const guildId = newPresence?.guild?.id || oldPresence?.guild?.id;

    if (!channelId || !guildId) return;

    const databaseSecondary = await this.isChannelSecondary(channelId);

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

    this.secondaryService.updateName(guildId, channelId);
  }
}
