import {
  Resolver,
  Field,
  ID,
  ObjectType,
  Query,
  Args,
  Subscription,
  Parent,
  ResolveField,
} from '@nestjs/graphql';

import { PrismaService } from '../prisma';
import { PubSubService } from '../pubsub';

import { Guild, GuildUpdate } from './guild.model';

@Resolver((of) => Guild)
export class GuildResolver {
  constructor(
    private readonly db: PrismaService,
    private readonly pubSub: PubSubService,
  ) {}

  @Query((returns) => [Guild])
  guilds() {
    return this.db.guild.findMany();
  }

  @Subscription((returns) => GuildUpdate)
  guildUpdate() {
    return this.pubSub.asyncIterator('guildUpdate');
  }

  @Query((returns) => Guild)
  guild(@Args('id', { type: () => ID }) id: string) {
    return this.db.guild.findUnique({
      where: {
        id,
      },
    });
  }

  @ResolveField()
  async primaries(@Parent() guild: Guild) {
    const { id } = guild;

    return this.db.primary.findMany({
      where: {
        guildId: id,
      },
    });
  }

  @ResolveField()
  async secondaries(@Parent() guild: Guild) {
    const { id } = guild;

    return this.db.secondary.findMany({
      where: {
        guildId: id,
      },
    });
  }

  @ResolveField()
  async aliases(@Parent() guild: Guild) {
    const { id } = guild;

    return this.db.alias.findMany({
      where: {
        guildId: id,
      },
    });
  }
}
