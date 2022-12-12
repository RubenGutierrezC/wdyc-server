import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PhraseToAnswerDocument = HydratedDocument<PhraseToAnswer>;

@Schema()
export class PhraseToAnswer {
  @Prop({ required: true })
  phrase: string;
}

export const PhraseToAnswerSchema =
  SchemaFactory.createForClass(PhraseToAnswer);
