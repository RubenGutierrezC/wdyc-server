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

      const file = await sharp(imageData)
        .resize(300, 300, {
          fit: 'fill',
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
      });
      return register.save();
    } catch (error) {
      throw new Error(error);
    }
  }

  async approveById({ urls }: ApproveDTO) {
    try {
      const elementToAprove = await this.pendingToAproveModel.find({
        _id: { $in: urls },
      });

      const result = await Promise.allSettled(
        elementToAprove.map(async (elementToAprove) => {
          if (!elementToAprove) {
            throw new NotFoundException('not found');
          }

          if (elementToAprove.type === 'IMAGE') {
            const image = await this.memeModel.create({
              url: elementToAprove.content,
            });

            const savedImage = await image.save();

            await elementToAprove.delete();

            return {
              message: 'image saved',
              id: savedImage._id,
            };
          }

          if (elementToAprove.type === 'PHRASE_TO_ANSWER') {
            const phrase = await this.phraseToAnswerModel.create({
              phrase: elementToAprove.content,
            });

            const savedPhrase = await phrase.save();

            await elementToAprove.delete();

            return {
              message: 'phrase saved',
              id: savedPhrase._id,
            };
          }
        }),
      );

      return result;
    } catch (error) {
      throw new Error(error);
    }
  }
}
