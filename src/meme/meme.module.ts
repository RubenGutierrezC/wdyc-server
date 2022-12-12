import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meme, MemeSchema } from './meme.entity';
import { MemeService } from './meme.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Meme.name, schema: MemeSchema }]),
  ],
  exports: [MemeService],
  providers: [MemeService],
})
export class MemeModule {}
