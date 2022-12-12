import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PhraseToAnswer,
  PhraseToAnswerDocument,
} from './phrase-to-answer.entity';

@Injectable()
export class PhraseToAnswerService {
  constructor(
    @InjectModel(PhraseToAnswer.name)
    private phraseToAnswerModel: Model<PhraseToAnswerDocument>,
  ) {}

  async get() {
    return this.phraseToAnswerModel.find();
  }
}
