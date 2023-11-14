import { Inject, Injectable } from '@nestjs/common';
import {
  ActionRowBuilder,
  ChannelType,
  Client,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { and, eq, sql } from 'drizzle-orm';

import { primary, secondary } from '@/db/schema';
import { MqttService } from '@/features/mqtt';
import { SecondaryService } from '@/features/secondary';
import { getPresence } from '@/utils/presence';

import { DRIZZLE_TOKEN, type Drizzle } from '../drizzle/drizzle.module';
import { IntentsError } from '../secondary/secondary.service';

@Injectable()
export class PrimaryService {
  public constructor(
    private readonly client: Client,
    @Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
    private readonly secondaryService: SecondaryService,
    private readonly mqtt: MqttService,
  ) {}

  /**
   * Create a primary channel
   * @param creator The user id of the creator
   * @param guildId The guild id to create the primary in
   * @param sectionId The section id to create the primary in
   * @returns The created primary
   */
  public async create(creator: string, guildId: string, sectionId?: string) {
    const guild = await this.client.guilds.fetch(guildId);

    const channelId = await guild.channels.create({
      name: `➕ New Session`,
      type: ChannelType.GuildVoice,
      parent: sectionId,
    });

    // const primary = await this.db.primary.create({
    //   data: {
    //     id: channelId.id,
    //     creator,
    //     guild: {
    //       connectOrCreate: {
    //         where: {
    //           id: guild.id,
    //         },
    //         create: {
    //           id: guild.id,
    //         },
    //       },
    //     },
    //   },
    // });

    await this.db
      .insert(primary)
      .values({
        creator,
        guildId: guildId,
        id: channelId.id,
      })
      .returning();

    const [{ primaryCount }] = await this.db
      .select({
        primaryCount: sql<number>`COUNT(*)`,
      })
      .from(primary);
    const [{ secondaryCount }] = await this.db
      .select({
        secondaryCount: sql<number>`COUNT(*)`,
      })
      .from(secondary);

    if (this.client.user) {
      this.client.user.setPresence(getPresence(primaryCount + secondaryCount));
    }

    await this.mqtt.publish(`dynamica/primaries`, primaryCount);

    return channelId;
  }

  /**
   * Update a primary in the database, if the bot has left the guild, delete it
   * @param guildId The guild id to update primaries
   * @param id The primary id to update
   * @returns The updated primary
   */
  public async update(guildId: string, id: string) {
    const primary = await this.client.channels.fetch(id);

    if (!primary) {
      throw new IntentsError('Client channel');
    }

    if (primary.type !== ChannelType.GuildVoice) {
      return;
    }

    const { members } = primary;

    const firstMember = members.first();

    const rest = members.filter((member) => member.id !== firstMember?.id);

    if (firstMember) {
      const newChannel = await this.secondaryService.create(
        guildId,
        id,
        firstMember.id,
      );
      await Promise.all(
        rest.map((member) => member.voice.setChannel(newChannel.id)),
      );
    }
  }

  /**
   * Cleanup primaries that are no longer in the guild
   */
  public async cleanup() {
    const primaries = await this.db
      .select({ id: primary.id, guildId: primary.guildId })
      .from(primary);
    await Promise.all(
      primaries.map(({ id, guildId }) => this.update(guildId, id)),
    );
  }

  /**
   * Update secondaries for a primary
   * @param guildId The guild id to update secondaries for
   * @param primaryId The primary id to update secondaries for
   * @returns The updated primary
   */
  public async updateSecondaries(guildId: string, primaryId: string) {
    const databaseSecondaries = await this.db
      .select({ id: secondary.id, guildId: secondary.guildId })
      .from(secondary)
      .where(eq(secondary.primaryId, primaryId));

    await Promise.all(
      databaseSecondaries.map(({ id }) =>
        this.secondaryService.update(guildId, id),
      ),
    );

    return databaseSecondaries;
  }

  /**
   * Update the general template for a primary
   * @param guildId The guild id to update the general template for
   * @param primaryId The primary id to update the general template for
   * @param newTemplate The new general template
   * @returns The updated primary
   */
  public async general(
    guildId: string,
    primaryId: string,
    newTemplate: string,
  ) {
    const databasePrimary = await this.db
      .select()
      .from(primary)
      .where(and(eq(primary.guildId, guildId), eq(primary.id, primaryId)));

    if (!databasePrimary) {
      throw new Error('No primary found');
    }

    const [updatedPrimary] = await this.db.update(primary).set({
      generalName: newTemplate,
    });

    await this.updateSecondaries(guildId, primaryId);

    return updatedPrimary;
  }

  /**
   * Update the game template for a primary
   * @param guildId Update the game template for a primary
   * @param primaryId The primary id to update the game template for
   * @param newTemplate The new game template
   * @returns The updated primary
   */
  public async template(
    guildId: string,
    primaryId: string,
    newTemplate: string,
  ) {
    const [databasePrimary] = await this.db
      .select()
      .from(primary)
      .where(and(eq(primary.guildId, guildId), eq(primary.id, primaryId)));

    if (!databasePrimary) {
      throw new Error('No primary found');
    }

    const updatedPrimary = await this.db
      .update(primary)
      .set({
        template: newTemplate,
      })
      .where(and(eq(primary.guildId, guildId), eq(primary.id, primaryId)));

    await this.updateSecondaries(guildId, primaryId);

    return updatedPrimary;
  }

  /**
   * Get the primary info
   * @param guildId The guild id to get the primary from
   * @param primaryId The primary id to get the info for
   * @returns The primary info
   */
  public async info(guildId: string, primaryId: string) {
    const [databasePrimary] = await this.db
      .select()
      .from(primary)
      .where(and(eq(primary.guildId, guildId), eq(primary.id, primaryId)));

    const secondaries = await this.db
      .select({ id: secondary.id })
      .from(secondary)
      .where(eq(secondary.primaryId, primaryId));

    if (!databasePrimary) {
      throw new Error('No primary found');
    }

    return { ...databasePrimary, secondaries };
  }

  public async createPrimaryModal(
    guildId: string,
    id: string,
  ): Promise<ModalBuilder> {
    const [databasePrimary] = await this.db
      .select()
      .from(primary)
      .where(and(eq(primary.guildId, guildId), eq(primary.id, id)));

    if (!databasePrimary) {
      throw new Error('No primary found');
    }

    const { generalName, template } = databasePrimary;

    return new ModalBuilder()
      .setTitle('Edit Primary Channel')
      .setCustomId(`primary/${id}`)
      .setComponents([
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
          new TextInputBuilder()
            .setCustomId('general')
            .setLabel('General Template')
            .setStyle(TextInputStyle.Short)
            .setValue(generalName),
        ]),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents([
          new TextInputBuilder()
            .setCustomId('template')
            .setLabel('Game Template')
            .setStyle(TextInputStyle.Short)
            .setValue(template),
        ]),
      ]);
  }
}
