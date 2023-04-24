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

import { Primary } from './primary.model';
import { PrimaryService } from './primary.service';

@Resolver((of) => Primary)
export class PrimaryResolver {
  constructor(
    private readonly db: PrismaService,
    private readonly primaryService: PrimaryService,
  ) {}

  @Query((returns) => [Primary])
  primaries() {
    return this.db.primary.findMany();
  }

  @Subscription((returns) => Primary)
  primaryCreated() {
    return this.primaryService.pubSub.asyncIterator('primaryCreated');
  }

  @Subscription((returns) => Primary)
  primaryDeleted() {
    return this.primaryService.pubSub.asyncIterator('primaryDeleted');
  }

  @Query((returns) => Primary)
  async primary(@Args('id', { type: () => ID }) id: string) {
    return this.db.primary.findUnique({
      where: {
        id,
      },
    });
  }

  @ResolveField()
  async secondaries(@Parent() primary: Primary) {
    const { id } = primary;

    return this.db.secondary.findMany({
      where: {
        primaryId: id,
      },
    });
  }

  @ResolveField()
  async guild(@Parent() primary: Primary) {
    const { guildId } = primary;

    return this.db.guild.findUnique({
      where: {
        id: guildId,
      },
    });
  }
}
