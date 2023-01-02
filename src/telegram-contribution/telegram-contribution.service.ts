import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TelegramContribution,
  TelegramContributionDocument,
} from './telegram-contribution.entity';

@Injectable()
export class TelegramContributionService {
  constructor(
    @InjectModel(TelegramContribution.name)
    private telegramContributionModel: Model<TelegramContributionDocument>,
  ) {}

  async addContribution(username: string) {
    const contribution = await this.telegramContributionModel.findOneAndUpdate(
      { username },
      { $inc: { contributions: 1 } },
    );

    if (!contribution) {
      const newContribution = await this.telegramContributionModel.create({
        username,
        contributions: 1,
      });

      await newContribution.save();
    }
  }
}
