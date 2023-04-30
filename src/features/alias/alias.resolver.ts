import {
  Resolver,
  ID,
  Query,
  Args,
  Subscription,
  ResolveField,
  Parent,
} from '@nestjs/graphql';

import { PrismaService } from '../prisma';
import { PubSubService } from '../pubsub';

import { Alias, AliasUpdate } from './alias.model';

@Resolver(() => Alias)
export class AliasResolver {
  constructor(
    private readonly db: PrismaService,
    private readonly pubSub: PubSubService,
  ) {}

  @Query(() => [Alias])
  aliases() {
    return this.db.alias.findMany();
  }

  @Subscription(() => AliasUpdate)
  aliasUpdate() {
    return this.pubSub.asyncIterator('aliasUpdate');
  }

  @Query(() => Alias)
  alias(@Args('id', { type: () => ID }) id: number) {
    return this.db.alias.findUnique({
      where: {
        id,
      },
    });
  }

  @ResolveField()
  async guild(@Parent() alias: Alias) {
    const { guildId } = alias;
    return this.db.guild.findUnique({
      where: {
        id: guildId,
      },
    });
  }
}
