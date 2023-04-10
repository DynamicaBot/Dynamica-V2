import { Injectable } from '@nestjs/common';
import { channel } from 'diagnostics_channel';
import { ActivityType } from 'discord.js';
import { Context, type ContextOf, On } from 'necord';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecondaryService } from './secondary.service';

@Injectable()
export class SecondaryEvents {
  constructor(
    private readonly db: PrismaService,
    private readonly secondaryService: SecondaryService,
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
      ? await this.db.secondary.findUnique({
          where: {
            id: oldVoiceState.channelId,
          },
        })
      : undefined;

    const newSecondary = newVoiceState.channelId
      ? await this.db.secondary.findUnique({
          where: {
            id: newVoiceState.channelId,
          },
        })
      : undefined;

    const oldPrimary = oldVoiceState.channelId
      ? await this.db.primary.findUnique({
          where: {
            id: oldVoiceState.channelId,
          },
        })
      : undefined;

    const newPrimary = newVoiceState.channelId
      ? await this.db.primary.findUnique({
          where: {
            id: newVoiceState.channelId,
          },
        })
      : undefined;

    if (!oldSecondary && !newSecondary && !oldPrimary && !newPrimary) {
      // Nothing to do with dynamica
      return;
    }

    if (oldSecondary) {
      // Left a secondary channel
      const channelId = oldSecondary.id;
      await this.secondaryService.update(channelId);
    }

    if (newSecondary && newSecondary.primaryId !== oldPrimary?.id) {
      // Joined a secondary channel but not from it's primary (prevents double counting) on create
      const channelId = newSecondary.id;
      await this.secondaryService.update(channelId);
    }

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

    const databaseChannel = await this.db.secondary.findUnique({
      where: {
        id: channel.id,
      },
    });

    if (!databaseChannel) return;

    await this.db.secondary.delete({
      where: {
        id: databaseChannel.id,
      },
    });
  }

  @On('presenceUpdate')
  public async onPresenceUpdate(
    @Context() [oldPresence, newPresence]: ContextOf<'presenceUpdate'>,
  ) {
    const channelId = newPresence.member.voice?.channelId;

    if (!channelId) return;

    const databaseSecondary = await this.db.secondary.findUnique({
        where: {
            id: channelId
        }
    })

    if (!databaseSecondary) return;

    const oldActivities = oldPresence.activities.filter(
      (activity) =>
        activity.type === ActivityType.Playing ||
        activity.type === ActivityType.Competing,
    );

    const oldActivityList = [
      ...new Set(oldActivities.map((activity) => activity.name)),
    ].sort();

    const newActivities = newPresence.activities.filter(
      (activity) =>
        activity.type === ActivityType.Playing ||
        activity.type === ActivityType.Competing,
    );

    const newActivityList = [
      ...new Set(newActivities.map((activity) => activity.name)),
    ].sort();

    const isSameActivities = JSON.stringify(oldActivityList) === JSON.stringify(newActivityList)

    if (isSameActivities) return;

    this.secondaryService.updateName(channelId)

  }
}
