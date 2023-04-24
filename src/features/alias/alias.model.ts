import { Field, ObjectType, GraphQLISODateTime, ID } from '@nestjs/graphql';
import { Alias as PrismaAlias } from '@prisma/client';

import { Guild } from '../guild/guild.model';

@ObjectType()
export class Alias implements PrismaAlias {
  @Field((type) => ID)
  id: number;
  @Field()
  activity: string;
  @Field()
  alias: string;
  @Field()
  guildId: string;
  @Field()
  createdAt: Date;
  @Field()
  updatedAt: Date;
  @Field((type) => Guild)
  guild: Guild;
}
