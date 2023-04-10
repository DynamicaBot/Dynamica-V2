import { Module } from '@nestjs/common';
import { PrimaryService} from './primary.service'
import { PrimaryCommands } from './primary.commands'
import { PrimaryEvents } from './primary.events';

@Module({
    providers: [PrimaryService, PrimaryCommands, PrimaryEvents]
})
export class PrimaryModule {}
