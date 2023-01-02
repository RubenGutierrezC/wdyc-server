import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TelegramContributionDocument =
  HydratedDocument<TelegramContribution>;

@Schema()
export class TelegramContribution {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  contributions: number;
}

export const TelegramContributionSchema =
  SchemaFactory.createForClass(TelegramContribution);
