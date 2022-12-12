import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { ConfigModule } from '@nestjs/config';
import { redisModule } from './modules.config';
import { MemeModule } from '../meme/meme.module';
import { PhraseToAnswerModule } from '../phrase-to-answer/phrase-to-answer.module';

@Module({
  imports: [ConfigModule, redisModule, MemeModule, PhraseToAnswerModule],
  controllers: [GameController],
  providers: [GameGateway, GameService],
})
export class GameModule {}
