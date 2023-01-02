import { Module } from '@nestjs/common';
import { PendingToAproveService } from './pending-to-aprove.service';
import { PendingToAproveController } from './pending-to-aprove.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PendingToAprove,
  PendingToAproveSchema,
} from './pending-to-aprove.entity';
import { Meme } from '../meme/meme.entity';
import { MemeSchema } from '../meme/meme.entity';
import { UploadModule } from '../upload/upload.module';
import { TelegramContributionModule } from '../telegram-contribution/telegram-contribution.module';
import {
  PhraseToAnswer,
  PhraseToAnswerSchema,
} from '../phrase-to-answer/phrase-to-answer.entity';

// TODO: Meme and phraseToAnswer must be module imports
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PendingToAprove.name, schema: PendingToAproveSchema },
      { name: Meme.name, schema: MemeSchema },
      { name: PhraseToAnswer.name, schema: PhraseToAnswerSchema },
    ]),
    TelegramContributionModule,
    UploadModule,
  ],
  providers: [PendingToAproveService],
  controllers: [PendingToAproveController],
  exports: [PendingToAproveService],
})
export class PendingToAproveModule {}
