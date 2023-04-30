import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Alias as PrismaAlias } from '@prisma/client';

import { UpdateModel } from '@/utils/UpdateModel';

import { Guild } from '../guild/guild.model';

@ObjectType()
export class Alias implements PrismaAlias {
  @Field(() => ID)
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
  @Field(() => Guild)
  guild: Guild;
}

@ObjectType()
export class AliasUpdate extends UpdateModel {
  @Field(() => Alias)
  data: Alias;
}
