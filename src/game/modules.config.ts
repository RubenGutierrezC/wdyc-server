import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from './redis.module';
import { EnvService } from '../env/env.service';
import { EnvModule } from '../env/env.module';

export const redisModule = RedisModule.registerAsync({
  imports: [ConfigModule, EnvModule],
  inject: [ConfigService, EnvService],
  useFactory: async (env: any) => {
    const logger = new Logger('RedisModule');

    return {
      connectionOptions: {
        host: env.cache.REDIS_HOST,
        port: Number(env.cache.REDIS_PORT),
        db: Number(env.cache.REDIS_DB),
        password: env.cache.REDIS_PASSWORD,
      },

      onClientReady: (client) => {
        logger.log('Redis client ready');

        client.on('error', (err) => {
          logger.error('Redis client error:', err);
        });

        client.on('connect', () => {
          logger.log(
            `Connectec to redis on ${client.options.host}:${client.options.port}`,
          );
        });
      },
    };
  },
});
