import { Field, ObjectType, GraphQLISODateTime, ID } from '@nestjs/graphql';
import { Secondary as PrismaSecondary } from '@prisma/client';

import { Guild } from '../guild/guild.model';
import { Primary } from '../primary/primary.model';

@ObjectType()
export class Secondary implements PrismaSecondary {
  @Field((type) => ID)
  id: string;
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  creator: string;
  @Field({ nullable: true })
  emoji: string;
  @Field()
  locked: boolean;
  @Field()
  guildId: string;
  @Field()
  primaryId: string;
  @Field()
  createdAt: Date;
  @Field()
  updatedAt: Date;
  @Field((type) => Guild)
  guild: Guild;
  @Field((type) => Primary)
  primary: Primary;
}
