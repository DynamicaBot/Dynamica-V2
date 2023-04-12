import { Global, Module } from '@nestjs/common';

import { MixpanelService } from './mixpanel.service';

@Global()
@Module({
  providers: [MixpanelService],
  exports: [MixpanelService],
})
export class MixpanelModule {}
