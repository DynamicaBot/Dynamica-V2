import path from 'path';
import { fileURLToPath } from 'url';

import { Logger } from '@nestjs/common';
import { ShardingManager } from 'discord.js';
import { config } from 'dotenv';

config();

export async function bootstrap() {
  const botPath = path.join(fileURLToPath(import.meta.url), '../bot.js');

  const manager = new ShardingManager(botPath, {
    token: process.env['TOKEN'],
  });

  const logger = new Logger('Shard Manager');

  manager.spawn();

  manager.on('shardCreate', (shard) => {
    shard.on('reconnecting', () => {
      logger.log(`Reconnecting shard: [${shard.id}]`);
    });

    shard.on('spawn', () => {
      logger.log(`Spawned shard: [${shard.id}]`);
    });

    shard.on('ready', () => {
      logger.log(` Shard [${shard.id}] is ready`);
    });

    shard.on('death', () => {
      logger.log(`Died shard: [${shard.id}]`);
    });

    shard.on('error', (err) => {
      logger.log(`Error in  [${shard.id}] with : ${err} `);
      shard.respawn();
    });
  });
}
bootstrap();
