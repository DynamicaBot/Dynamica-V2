import { registerEnumType } from '@nestjs/graphql';

enum UpdateMode {
  Update,
  Delete,
  Create,
}

registerEnumType(UpdateMode, {
  name: 'UpdateMode',
});

export default UpdateMode;
