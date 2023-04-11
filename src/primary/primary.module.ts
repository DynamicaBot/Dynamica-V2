import { Module } from '@nestjs/common';
import { PrimaryService} from './primary.service'
import { PrimaryCommands } from './primary.commands'
import { PrimaryEvents } from './primary.events';
import { SecondaryModule } from 'src/secondary/secondary.module';
import { SecondaryService } from 'src/secondary/secondary.service';

@Module({
    imports: [SecondaryModule],
    providers: [PrimaryService, PrimaryCommands, PrimaryEvents, SecondaryService],
    exports: [PrimaryService]
})
export class PrimaryModule {}
