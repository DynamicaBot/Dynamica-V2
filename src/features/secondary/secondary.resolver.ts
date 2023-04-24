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

import { Secondary } from './secondary.model';
import { SecondaryService } from './secondary.service';

@Resolver((of) => Secondary)
export class SecondaryResolver {
  constructor(
    private readonly db: PrismaService,
    private readonly secondaryService: SecondaryService,
  ) {}

  @Query((returns) => [Secondary])
  secondaries() {
    return this.db.secondary.findMany();
  }

  @Subscription((returns) => Secondary)
  secondaryCreated() {
    return this.secondaryService.pubSub.asyncIterator('secondaryCreated');
  }

  @Subscription((returns) => Secondary)
  secondaryDeleted() {
    return this.secondaryService.pubSub.asyncIterator('secondaryDeleted');
  }

  @Query((returns) => Secondary)
  secondary(@Args('id', { type: () => ID }) id: string) {
    return this.db.secondary.findUnique({
      where: {
        id,
      },
    });
  }

  @ResolveField()
  async primary(@Parent() secondary: Secondary) {
    const { primaryId } = secondary;

    return this.db.primary.findUnique({
      where: {
        id: primaryId,
      },
    });
  }

  @ResolveField()
  async guild(@Parent() secondary: Secondary) {
    const { guildId } = secondary;

    return this.db.guild.findUnique({
      where: {
        id: guildId,
      },
    });
  }
}
