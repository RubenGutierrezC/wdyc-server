import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameModule } from './game/game.module';
import { MemeModule } from './meme/meme.module';
import { EnvModule } from './env/env.module';
import { EnvService } from './env/env.service';
import { PhraseToAnswerModule } from './phrase-to-answer/phrase-to-answer.module';
import { PhraseToCompleteModule } from './phrase-to-complete/phrase-to-complete.module';
import { PendingToAproveModule } from './pending-to-aprove/pending-to-aprove.module';
import { UploadModule } from './upload/upload.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    EnvModule,
    LoggerModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: async (env: EnvService) => env.getPinoConfig(),
    }),
    MongooseModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: async (env: EnvService) => env.getDatabaseConfig(),
    }),
    GameModule,
    MemeModule,
    PhraseToAnswerModule,
    PhraseToCompleteModule,
    PendingToAproveModule,
    UploadModule,
  ],
})
export class AppModule {}
