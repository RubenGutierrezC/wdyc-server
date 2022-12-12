import { ValidationPipe, Logger as NestLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { EnvService } from './env/env.service';
import compress from '@fastify/compress';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      disableRequestLogging: true,
    }),
  );

  const env = app.get(EnvService);
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  app.register(compress);

  await app.listen(env.PORT, '0.0.0.0', (err, address) => {
    if (err) {
      NestLogger.log(err);
      process.exit(1);
    }

    NestLogger.log(`App listening on ${address}`);
  });
}

bootstrap();
