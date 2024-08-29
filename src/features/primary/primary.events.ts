import { Inject, Injectable } from "@nestjs/common";
import { Context, type ContextOf, On } from "necord";

import { MqttService } from "@/features/mqtt";

import { getPresence } from "@/utils/presence";

import { PrimaryService } from "./primary.service";
import { type Drizzle, DRIZZLE_TOKEN } from "../drizzle/drizzle.module";
import { count, eq } from "drizzle-orm";
import { primaryTable } from "../drizzle/schema";

@Injectable()
export class PrimaryEvents {
	constructor(
		@Inject(DRIZZLE_TOKEN) private readonly db: Drizzle,
		private readonly mqtt: MqttService,
		private readonly primaryService: PrimaryService,
	) {}

	@On("channelDelete")
	public async onChannelDelete(
		@Context() [channel]: ContextOf<"channelDelete">,
	) {
		if (channel.isDMBased()) return;

		const databasePrimary = this.db.query.primaryTable.findFirst({
			where: eq(primaryTable.id, channel.id),
		});

		if (!databasePrimary) return;

		await this.db.delete(primaryTable).where(eq(primaryTable.id, channel.id));

		const [{ primaryCount }] = await this.db
			.select({
				primaryCount: count(),
			})
			.from(primaryTable);

		const [{ secondaryCount }] = await this.db
			.select({
				secondaryCount: count(),
			})
			.from(primaryTable);

		channel.client.user.setPresence(getPresence(primaryCount + secondaryCount));

		await this.mqtt.publish("dynamica/primaries", primaryCount);
	}
}
