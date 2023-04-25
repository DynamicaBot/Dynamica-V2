import { Field, ObjectType } from '@nestjs/graphql';

import UpdateMode from './UpdateMode';

@ObjectType()
export class UpdateModel {
  @Field(() => UpdateMode)
  mode: UpdateMode;
}
