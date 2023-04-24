import {
  Resolver,
  Field,
  ID,
  ObjectType,
  Query,
  Args,
  Subscription,
  ResolveField,
  Parent,
} from '@nestjs/graphql';

import { PrismaService } from '../prisma';

import { Alias } from './alias.model';
import { AliasService } from './alias.service';

@Resolver((of) => Alias)
export class AliasResolver {
  constructor(
    private readonly db: PrismaService,
    private readonly aliasService: AliasService,
  ) {}

  @Query((returns) => [Alias])
  aliases() {
    return this.db.alias.findMany();
  }

  @Subscription((returns) => Alias)
  aliasUpserted() {
    return this.aliasService.pubSub.asyncIterator('aliasUpserted');
  }

  @Subscription((returns) => Alias)
  aliasDeleted() {
    return this.aliasService.pubSub.asyncIterator('aliasDeleted');
  }

  @Query((returns) => Alias)
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
