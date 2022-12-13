import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MemeDocument = HydratedDocument<Meme>;

enum imageType {
  V = 'V', // vertical
  H = 'H', // horizontal
  N = 'null',
}

@Schema()
export class Meme {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true, enum: imageType })
  imageOrientation: string;
}

export const MemeSchema = SchemaFactory.createForClass(Meme);
