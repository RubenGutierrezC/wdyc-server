import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PendingToAproveDocument = HydratedDocument<PendingToAprove>;

enum type {
  IMAGE = 'IMAGE',
  PHRASE_TO_COMPLETE = 'PHRASE_TO_COMPLETE',
  PHRASE_TO_ANSWER = 'PHRASE_TO_ANSWER',
}

@Schema()
export class PendingToAprove {
  @Prop({ required: true, enum: type })
  type: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  uploadMode: string;

  @Prop({ required: true })
  uploadedBy: string;
}

export const PendingToAproveSchema =
  SchemaFactory.createForClass(PendingToAprove);
