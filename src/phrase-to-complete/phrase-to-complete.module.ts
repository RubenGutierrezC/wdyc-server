import { Module } from '@nestjs/common';
import { PhraseToCompleteService } from './phrase-to-complete.service';

@Module({
  providers: [PhraseToCompleteService]
})
export class PhraseToCompleteModule {}
