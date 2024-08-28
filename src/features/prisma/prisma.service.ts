import { Injectable, type OnModuleInit, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	private readonly logger = new Logger(PrismaService.name);

	async onModuleInit() {
		await this.$connect();
		this.logger.log("Connected to database");
	}
}
