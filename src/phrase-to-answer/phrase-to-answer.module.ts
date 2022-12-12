import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhraseToAnswerService } from './phrase-to-answer.service';
import {
  PhraseToAnswer,
  PhraseToAnswerSchema,
} from './phrase-to-answer.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PhraseToAnswer.name, schema: PhraseToAnswerSchema },
    ]),
  ],
  exports: [PhraseToAnswerService],
  providers: [PhraseToAnswerService],
})
export class PhraseToAnswerModule {}
