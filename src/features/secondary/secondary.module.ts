import { Module } from "@nestjs/common";

import { SecondaryButtons } from "./secondary.buttons";
import { SecondaryCommands } from "./secondary.commands";
import { SecondaryEvents } from "./secondary.events";
import { SecondaryModals } from "./secondary.modals";
import { SecondarySelectors } from "./secondary.selectors";
import { SecondaryService } from "./secondary.service";

@Module({
	imports: [],
	providers: [
		SecondaryService,
		SecondaryCommands,
		SecondaryEvents,
		SecondaryModals,
		SecondaryButtons,
		SecondarySelectors,
	],
	exports: [SecondaryService],
})
export class SecondaryModule {}
