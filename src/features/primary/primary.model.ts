import { Field, ObjectType, GraphQLISODateTime, ID } from '@nestjs/graphql';
import { Primary as PrismaPrimary } from '@prisma/client';

import { Guild } from '../guild/guild.model';
import { Secondary } from '../secondary/secondary.model';

@ObjectType()
export class Primary implements PrismaPrimary {
  @Field((type) => ID)
  id: string;
  @Field()
  creator: string;
  @Field()
  template: string;
  @Field()
  generalName: string;
  @Field()
  guildId: string;
  @Field()
  createdAt: Date;
  @Field()
  updatedAt: Date;
  @Field((type) => [Secondary])
  secondaries: Secondary[];
  @Field((type) => Guild)
  guild: Guild;
}
