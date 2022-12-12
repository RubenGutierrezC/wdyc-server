import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PhraseToCompleteDocument = HydratedDocument<PhraseToComplete>;

@Schema()
export class PhraseToComplete {
  @Prop({ required: true })
  phrase: string;
}

export const PhraseToCompleteSchema =
  SchemaFactory.createForClass(PhraseToComplete);
