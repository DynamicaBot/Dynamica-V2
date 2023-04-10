import { Injectable } from "@nestjs/common";
import { Client } from "discord.js";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class GuildService {
    public constructor(private readonly db: PrismaService, private readonly client: Client) {}

    public async update(id: string) {
        let guild = this.client.guilds.cache.get(id);

        if (!guild) {
            try {
                guild = await this.client.guilds.fetch(id);
            } catch (error) {
                await this.db.guild.delete({
                    where: {
                        id,
                    },
                });
            }
        }
    }

    public async cleanup() {
        const guilds = await this.db.guild.findMany();
        await Promise.all(guilds.map(({ id }) => this.update(id)));
    }

}