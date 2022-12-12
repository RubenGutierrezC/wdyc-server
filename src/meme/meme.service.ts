import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Meme, MemeDocument } from './meme.entity';

@Injectable()
export class MemeService {
  constructor(@InjectModel(Meme.name) private memeModel: Model<MemeDocument>) {}

  async get() {
    return this.memeModel.find();
  }
}
