import { Field, ObjectType, GraphQLISODateTime, ID } from '@nestjs/graphql';
import { Guild as PrismaGuild } from '@prisma/client';

import { Alias } from '../alias/alias.model';
import { Primary } from '../primary/primary.model';
import { Secondary } from '../secondary/secondary.model';

@ObjectType()
export class Guild implements PrismaGuild {
  @Field((type) => ID)
  id: string;
  @Field()
  allowJoinRequests: boolean;
  @Field()
  createdAt: Date;
  @Field()
  updatedAt: Date;
  @Field((type) => [Secondary])
  secondaries: Secondary[];
  @Field((type) => [Alias])
  aliases: Alias[];
  @Field((type) => [Primary])
  primaries: Primary[];
}
