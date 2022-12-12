import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MemeDocument = HydratedDocument<Meme>;

@Schema()
export class Meme {
  @Prop({ required: true })
  url: string;
}

export const MemeSchema = SchemaFactory.createForClass(Meme);
