import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePendingToAproveDTO } from './dto/createPendingToAproveDto';
import { Meme, MemeDocument } from '../meme/meme.entity';
import {
  PhraseToAnswer,
  PhraseToAnswerDocument,
} from '../phrase-to-answer/phrase-to-answer.entity';
import {
  PendingToAprove,
  PendingToAproveDocument,
} from './pending-to-aprove.entity';
import axios from 'axios';
import sharp from 'sharp';
import { UploadService } from '../upload/upload.service';
import { ApproveDTO } from './dto/approveDto';
import sizeOf from 'image-size';
import { TelegramContributionService } from '../telegram-contribution/telegram-contribution.service';
import { capitalize } from '../utils';

@Injectable()
export class PendingToAproveService {
  constructor(
    @InjectModel(PendingToAprove.name)
    private pendingToAproveModel: Model<PendingToAproveDocument>,
    @InjectModel(Meme.name)
    private memeModel: Model<MemeDocument>,
    @InjectModel(PhraseToAnswer.name)
    private phraseToAnswerModel: Model<PhraseToAnswerDocument>,
    private readonly uploadService: UploadService,
    private readonly telegramContributionService: TelegramContributionService,
  ) {}

  async get() {
    return this.pendingToAproveModel.find();
  }

  async create(data: CreatePendingToAproveDTO) {
    try {
      if (data.type !== 'IMAGE') {
        const register = await this.pendingToAproveModel.create(data);
        return register.save();
      }

      // TODO: validate url

      const { data: imageData } = await axios.get(data.content, {
        responseType: 'arraybuffer',
      });

      const dimensions = await sizeOf(imageData);

      const imageOrientation =
        dimensions.width - dimensions.height > 200 ? 'H' : 'V';

      const width = imageOrientation === 'H' ? 320 : 200;
      const height = imageOrientation === 'H' ? 200 : 320;

      const file = await sharp(imageData)
        .resize({
          width,
          height,
          fit: 'cover',
          withoutEnlargement: true,
        })
        .toFormat('webp')
        .toBuffer();

      const imageToUpload = {
        mimetype: 'image/webp',
        buffer: file,
      };

      const upload = await this.uploadService.uploadImage(imageToUpload);

      const register = await this.pendingToAproveModel.create({
        type: 'IMAGE',
        uploadMode: data.uploadMode,
        uploadedBy: data.uploadedBy,
        content: upload,
        imageOrientation,
      });
      return register.save();
    } catch (error) {
      throw new Error(error);
    }
  }

  async approveById({ urls }: ApproveDTO) {
    try {
      const elementsToAprove = await this.pendingToAproveModel.find({
        _id: { $in: urls },
      });

      const result = [];

      for (const elementToAprove of elementsToAprove) {
        try {
          if (!elementToAprove) {
            throw new NotFoundException('not found');
          }

          const response = {
            message: '',
            id: '',
          };

          if (elementToAprove.type === 'IMAGE') {
            const image = await this.memeModel.create({
              url: elementToAprove.content,
              imageOrientation: elementToAprove.imageOrientation,
            });

            const savedImage = await image.save();

            await elementToAprove.delete();

            response.message = 'image saved';
            response.id = savedImage._id.toString();
          }

          if (elementToAprove.type === 'PHRASE_TO_ANSWER') {
            const phrase = await this.phraseToAnswerModel.create({
              phrase: elementToAprove.content,
            });

            const savedPhrase = await phrase.save();

            await elementToAprove.delete();

            response.message = 'image saved';
            response.id = savedPhrase._id.toString();
          }

          await this.telegramContributionService.addContribution(
            elementToAprove.uploadedBy,
          );

          result.push(response);
        } catch (error) {
          console.log(error);
        }
      }

      return result;
    } catch (error) {
      throw new Error(error);
    }
  }

  async approveAll() {
    try {
      const elementsToAprove = await this.pendingToAproveModel.find();
      const result = [];

      for (const elementToAprove of elementsToAprove) {
        try {
          if (!elementToAprove) {
            throw new NotFoundException('not found');
          }

          const response = {
            message: '',
            id: '',
          };

          if (elementToAprove.type === 'IMAGE') {
            const image = await this.memeModel.create({
              url: elementToAprove.content,
              imageOrientation: elementToAprove.imageOrientation,
            });

            const savedImage = await image.save();

            await elementToAprove.delete();

            response.message = 'image saved';
            response.id = savedImage._id.toString();
          }

          if (elementToAprove.type === 'PHRASE_TO_ANSWER') {
            const phrase = await this.phraseToAnswerModel.create({
              phrase: capitalize(elementToAprove.content),
            });

            const savedPhrase = await phrase.save();

            await elementToAprove.delete();

            response.message = 'image saved';
            response.id = savedPhrase._id.toString();
          }

          await this.telegramContributionService.addContribution(
            elementToAprove.uploadedBy,
          );

          result.push(response);
        } catch (error) {
          console.log(error);
        }
      }

      return result;
    } catch (error) {
      throw new Error(error);
    }
  }
}
